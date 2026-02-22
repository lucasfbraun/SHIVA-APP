import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Helper para arredondar valores monetários (evita erros de arredondamento)
const arredondar = (valor: number): number => {
  return Math.round(valor * 100) / 100;
};

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
    const { nomeCliente, observacao, clienteId } = req.body;
    
    if (!nomeCliente) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    
    // Buscar a última comanda para obter o próximo número
    const ultimaComanda = await prisma.comanda.findFirst({
      orderBy: { numeroComanda: 'desc' },
      select: { numeroComanda: true }
    });
    
    const proximoNumero = (ultimaComanda?.numeroComanda || 0) + 1;
    
    const comanda = await prisma.comanda.create({
      data: {
        nomeCliente,
        observacao,
        clienteId: clienteId || null,
        status: 'ABERTA',
        numeroComanda: proximoNumero,
        total: 0,
        valorPago: 0,
        valorRestante: 0
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
    
    const subtotal = arredondar(produto.precoVenda * qtd);
    
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
      
      // Buscar comanda atual e atualizar com valores arredondados
      const comandaAtual = await tx.comanda.findUnique({ where: { id } });
      await tx.comanda.update({
        where: { id },
        data: {
          total: arredondar((comandaAtual?.total || 0) + subtotal),
          valorRestante: arredondar((comandaAtual?.valorRestante || 0) + subtotal)
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
    
    // Não permitir remover item já pago
    if (item.pago) {
      return res.status(400).json({ error: 'Não é possível remover item já pago' });
    }
    
    // Remover e atualizar total
    await prisma.$transaction(async (tx) => {
      await tx.itemComanda.delete({ where: { id: itemId } });
      const comandaAtual = await tx.comanda.findUnique({ where: { id } });
      await tx.comanda.update({
        where: { id },
        data: {
          total: arredondar((comandaAtual?.total || 0) - item.subtotal),
          valorRestante: arredondar((comandaAtual?.valorRestante || 0) - item.subtotal)
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
    
    // Verificar se há valor restante a pagar (considera valores < 0.01 como zero)
    const saldoDevedor = Math.abs(comanda.valorRestante) < 0.01 ? 0 : comanda.valorRestante;
    
    if (saldoDevedor > 0) {
      return res.status(400).json({ 
        error: `Não é possível fechar a comanda. Saldo devedor: R$ ${comanda.valorRestante.toFixed(2)}. Registre os pagamentos antes de fechar.`,
        valorRestante: comanda.valorRestante 
      });
    }
    
    // Validação adicional: verificar se há itens não pagos
    const itensNaoPagos = comanda.itens.filter(item => !item.pago);
    if (itensNaoPagos.length > 0 && comanda.valorPago === 0) {
      return res.status(400).json({ 
        error: `Há ${itensNaoPagos.length} item(ns) não pago(s). Marque os itens como pagos ou adicione pagamentos antes de fechar.`
      });
    }
    
    // Fechar comanda e dar baixa no estoque
    const resultado = await prisma.$transaction(async (tx) => {
      // Dar baixa no estoque de cada item (apenas produtos que controlam estoque)
      for (const item of comanda.itens) {
        // Buscar produto para verificar se controla estoque
        const produto = await tx.produto.findUnique({
          where: { id: item.produtoId },
          select: { controlaEstoque: true }
        });
        
        // Só dar baixa se o produto controla estoque
        if (produto?.controlaEstoque !== false) {
          await tx.estoque.update({
            where: { produtoId: item.produtoId },
            data: {
              quantidade: { decrement: item.quantidade }
            }
          });
        }
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

// POST - Marcar itens como pagos
router.post('/:id/pagar-itens', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itensIds } = req.body; // Array de IDs dos itens a marcar como pagos
    
    if (!Array.isArray(itensIds) || itensIds.length === 0) {
      return res.status(400).json({ error: 'IDs dos itens são obrigatórios' });
    }
    
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
    
    // Calcular valor dos itens a marcar como pagos
    const itensPagar = comanda.itens.filter(item => 
      itensIds.includes(item.id) && !item.pago
    );
    
    if (itensPagar.length === 0) {
      return res.status(400).json({ error: 'Nenhum item válido para marcar como pago' });
    }
    
    const valorPagar = arredondar(itensPagar.reduce((sum, item) => sum + item.subtotal, 0));
    
    // Marcar itens como pagos e atualizar comanda
    const resultado = await prisma.$transaction(async (tx) => {
      // Marcar itens como pagos
      await tx.itemComanda.updateMany({
        where: { id: { in: itensIds } },
        data: { pago: true }
      });
      
      // Buscar comanda atual e atualizar com valores arredondados
      const comandaAtual = await tx.comanda.findUnique({ where: { id } });
      const comandaAtualizada = await tx.comanda.update({
        where: { id },
        data: {
          valorPago: arredondar((comandaAtual?.valorPago || 0) + valorPagar),
          valorRestante: arredondar((comandaAtual?.valorRestante || 0) - valorPagar)
        },
        include: { itens: true }
      });
      
      return comandaAtualizada;
    });
    
    res.json({ 
      message: 'Itens marcados como pagos',
      valorPago: valorPagar,
      comanda: resultado
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao marcar itens como pagos' });
  }
});

// POST - Adicionar pagamento parcial
router.post('/:id/pagamento-parcial', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { valor } = req.body;
    
    if (!valor || parseFloat(valor) <= 0) {
      return res.status(400).json({ error: 'Valor do pagamento deve ser maior que zero' });
    }
    
    const valorPagamento = arredondar(parseFloat(valor));
    
    const comanda = await prisma.comanda.findUnique({ where: { id } });
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }
    
    if (comanda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Comanda não está aberta' });
    }
    
    if (valorPagamento > comanda.valorRestante + 0.01) { // Margem para arredondamento
      return res.status(400).json({ 
        error: 'Valor do pagamento excede o valor restante',
        valorRestante: comanda.valorRestante
      });
    }
    
    // Calcular novos valores com arredondamento
    const novoValorPago = arredondar((comanda.valorPago || 0) + valorPagamento);
    const novoValorRestante = arredondar(comanda.total - novoValorPago);
    
    // Se o valor restante ficar muito próximo de zero, ajustar para zero
    const valorRestanteFinal = Math.abs(novoValorRestante) < 0.01 ? 0 : novoValorRestante;
    
    const comandaAtualizada = await prisma.comanda.update({
      where: { id },
      data: {
        valorPago: novoValorPago,
        valorRestante: valorRestanteFinal
      },
      include: { itens: true }
    });
    
    res.json({
      message: 'Pagamento parcial registrado',
      valorPago: valorPagamento,
      comanda: comandaAtualizada
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao registrar pagamento' });
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

// POST - Recalcular valores da comanda (útil para comandas antigas)
router.post('/:id/recalcular', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const comanda = await prisma.comanda.findUnique({
      where: { id },
      include: { itens: true }
    });
    
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda não encontrada' });
    }
    
    // Calcular total de todos os itens
    const total = arredondar(comanda.itens.reduce((sum, item) => sum + item.subtotal, 0));
    
    // Calcular valor pago (soma dos itens pagos)
    const valorPago = arredondar(comanda.itens
      .filter(item => item.pago)
      .reduce((sum, item) => sum + item.subtotal, 0));
    
    // Calcular valor restante
    let valorRestante = arredondar(total - valorPago);
    
    // Se o valor restante for muito próximo de zero, ajustar para zero
    if (Math.abs(valorRestante) < 0.01) {
      valorRestante = 0;
    }
    
    const comandaAtualizada = await prisma.comanda.update({
      where: { id },
      data: {
        total,
        valorPago,
        valorRestante
      },
      include: { itens: true }
    });
    
    res.json({
      message: 'Valores recalculados com sucesso',
      comanda: comandaAtualizada
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao recalcular valores' });
  }
});

export default router;
