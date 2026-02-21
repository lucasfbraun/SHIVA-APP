import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET - Listar comandas
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const comandas = await prisma.comanda.findMany({
      where: {
        ...(status && { status: String(status).toUpperCase() })
      },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                nome: true,
                imagemUrl: true
              }
            }
          }
        }
      },
      orderBy: { dataAbertura: 'desc' }
    });
    
    res.json(comandas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar comandas' });
  }
});

// GET - Buscar comanda por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: {
        itens: {
          include: {
            produto: {
              select: {
                nome: true,
                imagemUrl: true,
                estoque: true
              }
            }
          }
        }
      }
    });
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }
    
    res.json(comanda);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar comanda' });
  }
});

// POST - Abrir nova comanda
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nomeCliente, observacao } = req.body;
    
    if (!nomeCliente) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    
    const comanda = await prisma.comanda.create({
      data: {
        nomeCliente,
        observacao,
        status: 'ABERTA'
      }
    });
    
    res.status(201).json(comanda);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao abrir comanda' });
  }
});

// POST - Adicionar item à comanda
router.post('/:id/itens', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { produtoId, quantidade } = req.body;
    
    if (!produtoId || !quantidade) {
      return res.status(400).json({ error: 'Produto e quantidade são obrigatórios' });
    }
    
    const qtd = parseFloat(quantidade);
    if (qtd <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser positiva' });
    }
    
    // Verificar se comanda está aberta
    const comanda = await prisma.comanda.findUnique({ where: { id } });
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }
    if (comanda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Comanda não está aberta' });
    }
    
    // Buscar produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Verificar estoque (aviso, não bloqueia)
    const estoqueDisponivel = produto.estoque?.quantidade || 0;
    if (estoqueDisponivel < qtd) {
      console.warn(`Aviso: Estoque insuficiente para ${produto.nome}. Disponível: ${estoqueDisponivel}, Solicitado: ${qtd}`);
    }
    
    const subtotal = produto.precoVenda * qtd;
    
    // Adicionar item e atualizar total
    const resultado = await prisma.$transaction(async (tx) => {
      const item = await tx.itemComanda.create({
        data: {
          comandaId: id,
          produtoId,
          nomeProduto: produto.nome,
          quantidade: qtd,
          precoUnitario: produto.precoVenda,
          subtotal
        }
      });
      
      // Atualizar total da comanda
      await tx.comanda.update({
        where: { id },
        data: {
          total: { increment: subtotal }
        }
      });
      
      return item;
    });
    
    res.status(201).json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao adicionar item' });
  }
});

// DELETE - Remover item da comanda
router.delete('/:id/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    
    // Verificar se comanda está aberta
    const comanda = await prisma.comanda.findUnique({ where: { id } });
    if (!comanda || comanda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Comanda não está aberta' });
    }
    
    // Buscar item
    const item = await prisma.itemComanda.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }
    
    // Remover e atualizar total
    await prisma.$transaction(async (tx) => {
      await tx.itemComanda.delete({ where: { id: itemId } });
      await tx.comanda.update({
        where: { id },
        data: {
          total: { decrement: item.subtotal }
        }
      });
    });
    
    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

// POST - Fechar comanda
router.post('/:id/fechar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: { itens: true }
    });
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }
    
    if (comanda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Comanda não está aberta' });
    }
    
    if (comanda.itens.length === 0) {
      return res.status(400).json({ error: 'Comanda vazia não pode ser fechada' });
    }
    
    // Fechar comanda e dar baixa no estoque
    const resultado = await prisma.$transaction(async (tx) => {
      // Dar baixa no estoque de cada item
      for (const item of comanda.itens) {
        await tx.estoque.update({
          where: { produtoId: item.produtoId },
          data: {
            quantidade: { decrement: item.quantidade }
          }
        });
      }
      
      // Fechar comanda
      const comandaFechada = await tx.comanda.update({
        where: { id },
        data: {
          status: 'FECHADA',
          dataFechamento: new Date()
        },
        include: { itens: true }
      });
      
      return comandaFechada;
    });
    
    res.json(resultado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao fechar comanda' });
  }
});

// POST - Cancelar comanda
router.post('/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const comanda = await prisma.comanda.findUnique({ where: { id } });
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }
    
    if (comanda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Apenas comandas abertas podem ser canceladas' });
    }
    
    const comandaCancelada = await prisma.comanda.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        dataFechamento: new Date()
      }
    });
    
    res.json(comandaCancelada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar comanda' });
  }
});

export default router;
