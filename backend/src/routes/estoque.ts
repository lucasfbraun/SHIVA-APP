import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET - Verificar estoque de um produto (para debug)
router.get('/verificar/:produtoId', async (req: Request, res: Response) => {
  try {
    const { produtoId } = req.params;
    
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json({
      produto: {
        id: produto.id,
        nome: produto.nome,
        controlaEstoque: produto.controlaEstoque
      },
      estoque: produto.estoque
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar estoque' });
  }
});

// POST - Entrada de estoque (atualiza quantidade e custo médio)
router.post('/entrada', async (req: Request, res: Response) => {
  try {
    const { produtoId, quantidade, custoUnitario, dataEntrada, numeroCupom, observacao } = req.body;
    
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
          dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
          numeroCupom: numeroCupom || null,
          tipoEntrada: 'MANUAL',
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

    console.log('=== Editar Estoque Manual ===');
    console.log('Produto ID:', produtoId);
    console.log('Body recebido:', req.body);
    console.log('Quantidade recebida:', quantidadeEstoque);

    if (quantidadeEstoque === undefined || quantidadeEstoque === null) {
      return res.status(400).json({ error: 'Quantidade é obrigatória' });
    }

    const qtd = parseFloat(String(quantidadeEstoque));

    if (isNaN(qtd)) {
      return res.status(400).json({ error: 'Quantidade inválida' });
    }

    if (qtd < 0) {
      return res.status(400).json({ error: 'Quantidade não pode ser negativa' });
    }

    console.log('Quantidade parseada:', qtd);

    // Verificar se produto existe
    const produtoExiste = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true }
    });

    if (!produtoExiste) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    console.log('Estoque atual antes da atualização:', produtoExiste.estoque);

    // Atualizar estoque diretamente (sem transaction para simplificar)
    const estoque = await prisma.estoque.upsert({
      where: { produtoId },
      update: { 
        quantidade: qtd 
      },
      create: { 
        produtoId, 
        quantidade: qtd 
      }
    });

    console.log('Estoque após atualização:', estoque);

    // Buscar produto atualizado com estoque
    const produtoAtualizado = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true }
    });

    console.log('Produto final retornado:', produtoAtualizado);

    res.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      produto: produtoAtualizado
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estoque:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar estoque' });
  }
});

// GET - Listar todas as entradas de estoque (com filtros)
router.get('/entradas', async (req: Request, res: Response) => {
  try {
    const { produtoId, tipoEntrada, dataInicio, dataFim } = req.query;
    
    const where: any = {};
    
    if (produtoId) {
      where.produtoId = String(produtoId);
    }
    
    if (tipoEntrada) {
      where.tipoEntrada = String(tipoEntrada).toUpperCase();
    }
    
    if (dataInicio || dataFim) {
      where.dataEntrada = {};
      if (dataInicio) {
        where.dataEntrada.gte = new Date(String(dataInicio));
      }
      if (dataFim) {
        where.dataEntrada.lte = new Date(String(dataFim));
      }
    }
    
    const entradas = await prisma.entradaEstoque.findMany({
      where,
      include: {
        produto: {
          select: {
            id: true,
            nome: true,
            categoria: true,
            codigoInterno: true,
            codigoBarras: true
          }
        }
      },
      orderBy: { dataEntrada: 'desc' }
    });
    
    res.json(entradas);
  } catch (error: any) {
    console.error('Erro ao buscar entradas:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar entradas de estoque' });
  }
});

// POST - Recalcular estoque de um produto ou todos os produtos
router.post('/recalcular', async (req: Request, res: Response) => {
  try {
    const { produtoId } = req.body;
    
    // Se não passou produtoId, recalcula todos
    const produtos = produtoId 
      ? await prisma.produto.findMany({ where: { id: produtoId, controlaEstoque: true } })
      : await prisma.produto.findMany({ where: { controlaEstoque: true } });
    
    if (produtos.length === 0) {
      return res.status(404).json({ error: 'Nenhum produto encontrado para recalcular' });
    }
    
    const resultados = [];
    
    for (const produto of produtos) {
      // Calcular total de entradas
      const entradas = await prisma.entradaEstoque.aggregate({
        where: { produtoId: produto.id },
        _sum: { quantidade: true }
      });
      
      const totalEntradas = entradas._sum.quantidade || 0;
      
      // Calcular total de saídas (vendas em comandas fechadas)
      const saidas = await prisma.itemComanda.aggregate({
        where: { 
          produtoId: produto.id,
          comanda: { status: 'FECHADA' }
        },
        _sum: { quantidade: true }
      });
      
      const totalSaidas = saidas._sum.quantidade || 0;
      
      // Estoque correto = entradas - saídas
      const estoqueCorreto = totalEntradas - totalSaidas;
      
      // Atualizar no banco
      await prisma.estoque.upsert({
        where: { produtoId: produto.id },
        update: { quantidade: estoqueCorreto },
        create: { 
          produtoId: produto.id, 
          quantidade: estoqueCorreto 
        }
      });
      
      resultados.push({
        produtoId: produto.id,
        nome: produto.nome,
        totalEntradas,
        totalSaidas,
        estoqueAnterior: produto.estoque?.quantidade || 0,
        estoqueCorreto
      });
    }
    
    res.json({
      success: true,
      message: `Estoque recalculado para ${resultados.length} produto(s)`,
      resultados
    });
  } catch (error: any) {
    console.error('Erro ao recalcular estoque:', error);
    res.status(500).json({ error: error.message || 'Erro ao recalcular estoque' });
  }
});

export default router;
