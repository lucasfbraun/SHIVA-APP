import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// POST - Entrada de estoque (atualiza quantidade e custo médio)
router.post('/entrada', async (req: Request, res: Response) => {
  try {
    const { produtoId, quantidade, custoUnitario, observacao } = req.body;
    
    if (!produtoId || !quantidade || !custoUnitario) {
      return res.status(400).json({ error: 'Produto, quantidade e custo são obrigatórios' });
    }
    
    const qtd = parseFloat(quantidade);
    const custo = parseFloat(custoUnitario); 
    
    if (qtd <= 0 || custo < 0) {
      return res.status(400).json({ error: 'Quantidade e custo devem ser positivos' });
    }
    
    // Buscar produto e estoque atual
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Calcular novo custo médio
    const estoqueAtual = produto.estoque?.quantidade || 0;
    const custoMedioAtual = produto.custoMedio || 0;
    
    const novaCustoMedio = estoqueAtual === 0
      ? custo
      : ((estoqueAtual * custoMedioAtual) + (qtd * custo)) / (estoqueAtual + qtd);
    
    // Atualizar em transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Registrar entrada
      const entrada = await tx.entradaEstoque.create({
        data: {
          produtoId,
          quantidade: qtd,
          custoUnitario: custo,
          observacao
        }
      });
      
      // Atualizar custo médio do produto
      await tx.produto.update({
        where: { id: produtoId },
        data: { custoMedio: novaCustoMedio }
      });
      
      // Atualizar estoque
      const estoque = await tx.estoque.upsert({
        where: { produtoId },
        update: {
          quantidade: { increment: qtd }
        },
        create: {
          produtoId,
          quantidade: qtd
        }
      });
      
      return { entrada, estoque, novaCustoMedio };
    });
    
    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao registrar entrada' });
  }
});

// GET - Histórico de entradas de um produto
router.get('/historico/:produtoId', async (req: Request, res: Response) => {
  try {
    const { produtoId } = req.params;
    
    const entradas = await prisma.entradaEstoque.findMany({
      where: { produtoId },
      orderBy: { criadoEm: 'desc' },
      include: {
        produto: {
          select: {
            nome: true,
            categoria: true
          }
        }
      }
    });
    
    res.json(entradas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// GET - Produtos com estoque baixo
router.get('/alerta/baixo', async (req: Request, res: Response) => {
  try {
    const { limite = 5 } = req.query;
    
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
        estoque: {
          quantidade: {
            lte: parseFloat(String(limite))
          }
        }
      },
      include: { estoque: true },
      orderBy: {
        estoque: {
          quantidade: 'asc'
        }
      }
    });
    
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos com estoque baixo' });
  }
});

// PUT - Editar estoque manualmente (sem nota/cupom)
router.put('/manual/:produtoId', async (req: Request, res: Response) => {
  try {
    const { produtoId } = req.params;
    const { quantidadeEstoque } = req.body;

    if (quantidadeEstoque === undefined || quantidadeEstoque === null) {
      return res.status(400).json({ error: 'Quantidade é obrigatória' });
    }

    const qtd = parseFloat(quantidadeEstoque);

    if (qtd < 0) {
      return res.status(400).json({ error: 'Quantidade não pode ser negativa' });
    }

    // Atualizar produto e estoque
    const resultado = await prisma.$transaction(async (tx) => {
      // Atualizar estoque
      const estoque = await tx.estoque.upsert({
        where: { produtoId },
        update: { quantidade: qtd },
        create: { produtoId, quantidade: qtd }
      });

      // Buscar produto atualizado com estoque
      const produto = await tx.produto.findUnique({
        where: { id: produtoId },
        include: { estoque: true }
      });

      return produto;
    });

    res.json(resultado);
  } catch (error: any) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar estoque' });
  }
});

export default router;
