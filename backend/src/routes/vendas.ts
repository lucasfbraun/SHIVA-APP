import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

const arredondar = (valor: number): number => {
  return Math.round(valor * 100) / 100;
};

const calcularSubtotal = (preco: number, qtd: number, desconto: number, tipoDesconto: string): number => {
  const subtotal = preco * qtd;
  if (desconto <= 0) return arredondar(subtotal);
  
  const descontoValor = tipoDesconto === 'PERCENTUAL' 
    ? (subtotal * desconto) / 100 
    : desconto;
  return arredondar(subtotal - descontoValor);
};

// GET - Listar vendas
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const vendas = await prisma.venda.findMany({
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
        },
        cliente: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      },
      orderBy: { dataAbertura: 'desc' }
    });
    
    res.json(vendas);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

// GET - Buscar venda por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const venda = await prisma.venda.findUnique({
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
        },
        cliente: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda nao encontrada' });
    }
    
    res.json(venda);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar venda' });
  }
});

// POST - Abrir nova venda
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nomeCliente, clienteId, observacao, tipoPagamento } = req.body;
    
    if (!nomeCliente || nomeCliente.trim() === '') {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    
    // Buscar o próximo número de venda
    const ultimaVenda = await prisma.venda.findFirst({
      orderBy: { numeroVenda: 'desc' },
      select: { numeroVenda: true }
    });
    
    const proximoNumero = (ultimaVenda?.numeroVenda || 0) + 1;
    
    const venda = await prisma.venda.create({
      data: {
        numeroVenda: proximoNumero,
        nomeCliente: nomeCliente.trim(),
        clienteId: clienteId || null,
        status: 'ABERTA',
        tipoPagamento: tipoPagamento || 'DINHEIRO',
        observacao: observacao?.trim() || null
      },
      include: {
        itens: true,
        cliente: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });
    
    res.status(201).json(venda);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao abrir venda' });
  }
});

// POST - Adicionar item à venda
router.post('/:id/itens', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { produtoId, quantidade, precoUnitario, desconto, tipoDesconto } = req.body;
    
    if (!produtoId || !quantidade) {
      return res.status(400).json({ error: 'Produto e quantidade sao obrigatórios' });
    }
    
    const qtd = parseFloat(quantidade);
    if (qtd <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que 0' });
    }
    
    // Verificar se venda existe e está aberta
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: { itens: true }
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda nao encontrada' });
    }
    
    if (venda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Venda já foi finalizada' });
    }
    
    // Buscar produto
    const produto = await prisma.produto.findUnique({
      where: { id: produtoId },
      include: { estoque: true }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto nao encontrado' });
    }
    
    const preco = precoUnitario || produto.precoVenda;
    const descontoValor = desconto || 0;
    const tipoDesc = tipoDesconto || 'VALOR';
    const subtotal = calcularSubtotal(preco, qtd, descontoValor, tipoDesc);
    
    // Criar item
    const item = await prisma.itemVenda.create({
      data: {
        vendaId: id,
        produtoId,
        nomeProduto: produto.nome,
        quantidade: qtd,
        precoUnitario: preco,
        custoUnitario: produto.custoMedio,
        desconto: descontoValor,
        tipoDesconto: tipoDesc,
        subtotal
      },
      include: {
        produto: {
          select: {
            nome: true,
            imagemUrl: true
          }
        }
      }
    });
    
    // Atualizar totais da venda
    const itensDataVenda = await prisma.itemVenda.findMany({
      where: { vendaId: id }
    });
    
    const subtotalVenda = arredondar(itensDataVenda.reduce((sum, i) => sum + i.subtotal, 0));
    const totalVenda = subtotalVenda;
    
    await prisma.venda.update({
      where: { id },
      data: {
        subtotal: subtotalVenda,
        total: totalVenda
      }
    });
    
    res.status(201).json(item);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar item à venda' });
  }
});

// PUT - Atualizar item da venda
router.put('/:vendaId/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const { vendaId, itemId } = req.params;
    const { quantidade, precoUnitario, desconto, tipoDesconto } = req.body;
    
    const item = await prisma.itemVenda.findUnique({
      where: { id: itemId },
      include: { venda: true }
    });
    
    if (!item || item.vendaId !== vendaId) {
      return res.status(404).json({ error: 'Item nao encontrado' });
    }
    
    if (item.venda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Nao pode editar item de venda finalizada' });
    }
    
    const novaQtd = quantidade ? parseFloat(quantidade) : item.quantidade;
    const novoPreco = precoUnitario || item.precoUnitario;
    const novoDesconto = desconto !== undefined ? desconto : item.desconto;
    const novoTipoDesc = tipoDesconto || item.tipoDesconto;
    
    if (novaQtd <= 0) {
      return res.status(400).json({ error: 'Quantidade deve ser maior que 0' });
    }
    
    const novoSubtotal = calcularSubtotal(novoPreco, novaQtd, novoDesconto, novoTipoDesc);
    
    const itemAtualizado = await prisma.itemVenda.update({
      where: { id: itemId },
      data: {
        quantidade: novaQtd,
        precoUnitario: novoPreco,
        desconto: novoDesconto,
        tipoDesconto: novoTipoDesc,
        subtotal: novoSubtotal
      },
      include: {
        produto: {
          select: {
            nome: true,
            imagemUrl: true
          }
        }
      }
    });
    
    // Recalcular totais
    const itens = await prisma.itemVenda.findMany({
      where: { vendaId }
    });
    
    const subtotalVenda = arredondar(itens.reduce((sum, i) => sum + i.subtotal, 0));
    const totalVenda = subtotalVenda;
    
    await prisma.venda.update({
      where: { id: vendaId },
      data: {
        subtotal: subtotalVenda,
        total: totalVenda
      }
    });
    
    res.json(itemAtualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item' });
  }
});

// DELETE - Remover item da venda
router.delete('/:vendaId/itens/:itemId', async (req: Request, res: Response) => {
  try {
    const { vendaId, itemId } = req.params;
    
    const item = await prisma.itemVenda.findUnique({
      where: { id: itemId }
    });
    
    if (!item || item.vendaId !== vendaId) {
      return res.status(404).json({ error: 'Item nao encontrado' });
    }
    
    const venda = await prisma.venda.findUnique({
      where: { id: vendaId }
    });
    
    if (venda?.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Nao pode remover item de venda finalizada' });
    }
    
    await prisma.itemVenda.delete({
      where: { id: itemId }
    });
    
    // Recalcular totais
    const itens = await prisma.itemVenda.findMany({
      where: { vendaId }
    });
    
    const subtotalVenda = arredondar(itens.reduce((sum, i) => sum + i.subtotal, 0));
    const totalVenda = subtotalVenda;
    
    await prisma.venda.update({
      where: { id: vendaId },
      data: {
        subtotal: subtotalVenda,
        total: totalVenda
      }
    });
    
    res.json({ message: 'Item removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover item' });
  }
});

// PUT - Aplicar desconto na venda
router.put('/:id/desconto', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { desconto, tipoDesconto } = req.body;
    
    if (desconto === undefined || desconto === null) {
      return res.status(400).json({ error: 'Desconto é obrigatório' });
    }
    
    const venda = await prisma.venda.findUnique({
      where: { id }
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda nao encontrada' });
    }
    
    if (venda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Nao pode aplicar desconto em venda finalizada' });
    }
    
    const descontoAplicado = arredondar(Number(desconto));
    const tipoDesc = tipoDesconto || 'VALOR';
    
    const descontoValor = tipoDesc === 'PERCENTUAL'
      ? arredondar((venda.subtotal * descontoAplicado) / 100)
      : descontoAplicado;
    
    const totalFinal = arredondar(venda.subtotal - descontoValor);
    
    const vendaAtualizada = await prisma.venda.update({
      where: { id },
      data: {
        desconto: descontoAplicado,
        tipoDesconto: tipoDesc,
        total: Math.max(totalFinal, 0)
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
        },
        cliente: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });
    
    res.json(vendaAtualizada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aplicar desconto' });
  }
});

// POST - Finalizar venda
router.post('/:id/finalizar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { valorPago, tipoPagamento } = req.body;
    
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: { itens: true }
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda nao encontrada' });
    }
    
    if (venda.status !== 'ABERTA') {
      return res.status(400).json({ error: 'Venda ja foi finalizada' });
    }
    
    if (venda.itens.length === 0) {
      return res.status(400).json({ error: 'Venda sem itens' });
    }
    
    // Movimentar estoque (saída/venda)
    for (const item of venda.itens) {
      const estoque = await prisma.estoque.findUnique({
        where: { produtoId: item.produtoId }
      });
      
      if (estoque) {
        await prisma.estoque.update({
          where: { produtoId: item.produtoId },
          data: {
            quantidade: {
              decrement: item.quantidade
            }
          }
        });
      }
    }
    
    const vPago = valorPago ? parseFloat(String(valorPago)) : 0;
    const valorRestante = arredondar(Math.max(venda.total - vPago, 0));
    
    const vendaFinalizada = await prisma.venda.update({
      where: { id },
      data: {
        status: 'FINALIZADA',
        valorPago: vPago,
        valorRestante,
        tipoPagamento: tipoPagamento || venda.tipoPagamento,
        dataFechamento: new Date()
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
        },
        cliente: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });
    
    res.json(vendaFinalizada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao finalizar venda' });
  }
});

// PUT - Cancelar venda
router.put('/:id/cancelar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const venda = await prisma.venda.findUnique({
      where: { id },
      include: { itens: true }
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda nao encontrada' });
    }
    
    if (venda.status === 'CANCELADA') {
      return res.status(400).json({ error: 'Venda ja foi cancelada' });
    }
    
    const vendaCancelada = await prisma.venda.update({
      where: { id },
      data: {
        status: 'CANCELADA',
        dataFechamento: new Date()
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
        },
        cliente: {
          select: {
            id: true,
            nomeCompleto: true
          }
        }
      }
    });
    
    res.json(vendaCancelada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar venda' });
  }
});

export default router;
