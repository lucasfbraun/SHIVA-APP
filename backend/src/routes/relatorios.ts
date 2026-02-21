import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET - Dashboard geral
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    const filtroData: any = {};
    if (dataInicio) {
      filtroData.gte = new Date(String(dataInicio));
    }
    if (dataFim) {
      filtroData.lte = new Date(String(dataFim));
    }
    
    const whereClause: any = {
      status: 'FECHADA'
    };
    
    if (Object.keys(filtroData).length > 0) {
      whereClause.dataFechamento = filtroData;
    }
    
    // Comandas fechadas
    const comandas = await prisma.comanda.findMany({
      where: whereClause,
      include: {
        itens: {
          include: {
            produto: true
          }
        }
      }
    });
    
    const totalComandas = comandas.length;
    const faturamentoTotal = comandas.reduce((acc, c) => acc + c.total, 0);
    const ticketMedio = totalComandas > 0 ? faturamentoTotal / totalComandas : 0;
    
    // Produtos mais vendidos
    const produtosVendidos: { [key: string]: { nome: string; quantidade: number; total: number } } = {};
    
    comandas.forEach(comanda => {
      comanda.itens.forEach(item => {
        if (!produtosVendidos[item.produtoId]) {
          produtosVendidos[item.produtoId] = {
            nome: item.nomeProduto,
            quantidade: 0,
            total: 0
          };
        }
        produtosVendidos[item.produtoId].quantidade += item.quantidade;
        produtosVendidos[item.produtoId].total += item.subtotal;
      });
    });
    
    const topProdutos = Object.entries(produtosVendidos)
      .map(([id, data]) => ({ produtoId: id, ...data }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);
    
    // Faturamento por dia (últimos 7 dias se não especificado)
    const faturamentoPorDia = comandas.reduce((acc: any, comanda) => {
      const data = comanda.dataFechamento!.toISOString().split('T')[0];
      if (!acc[data]) {
        acc[data] = 0;
      }
      acc[data] += comanda.total;
      return acc;
    }, {});
    
    res.json({
      periodo: {
        inicio: dataInicio || 'Início',
        fim: dataFim || 'Hoje'
      },
      resumo: {
        totalComandas,
        faturamentoTotal: parseFloat(faturamentoTotal.toFixed(2)),
        ticketMedio: parseFloat(ticketMedio.toFixed(2))
      },
      topProdutos,
      faturamentoPorDia
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao gerar relatório' });
  }
});

// GET - Ticket médio
router.get('/ticket-medio', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    const filtroData: any = {};
    if (dataInicio) filtroData.gte = new Date(String(dataInicio));
    if (dataFim) filtroData.lte = new Date(String(dataFim));
    
    const whereClause: any = { status: 'FECHADA' };
    if (Object.keys(filtroData).length > 0) {
      whereClause.dataFechamento = filtroData;
    }
    
    const comandas = await prisma.comanda.findMany({ where: whereClause });
    
    const total = comandas.reduce((acc, c) => acc + c.total, 0);
    const ticketMedio = comandas.length > 0 ? total / comandas.length : 0;
    
    res.json({
      totalComandas: comandas.length,
      faturamentoTotal: parseFloat(total.toFixed(2)),
      ticketMedio: parseFloat(ticketMedio.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular ticket médio' });
  }
});

// GET - Produtos mais vendidos
router.get('/produtos-mais-vendidos', async (req: Request, res: Response) => {
  try {
    const { limite = 10, dataInicio, dataFim } = req.query;
    
    const filtroData: any = {};
    if (dataInicio) filtroData.gte = new Date(String(dataInicio));
    if (dataFim) filtroData.lte = new Date(String(dataFim));
    
    const whereClause: any = { status: 'FECHADA' };
    if (Object.keys(filtroData).length > 0) {
      whereClause.dataFechamento = filtroData;
    }
    
    const itens = await prisma.itemComanda.findMany({
      where: {
        comanda: whereClause
      },
      include: {
        produto: {
          select: {
            nome: true,
            imagemUrl: true,
            categoria: true,
            custoMedio: true
          }
        }
      }
    });
    
    const produtosMap: { [key: string]: any } = {};
    
    itens.forEach(item => {
      if (!produtosMap[item.produtoId]) {
        produtosMap[item.produtoId] = {
          produtoId: item.produtoId,
          nome: item.nomeProduto,
          imagemUrl: item.produto.imagemUrl,
          categoria: item.produto.categoria,
          quantidadeVendida: 0,
          faturamento: 0,
          custoTotal: 0,
          margem: 0
        };
      }
      
      produtosMap[item.produtoId].quantidadeVendida += item.quantidade;
      produtosMap[item.produtoId].faturamento += item.subtotal;
      produtosMap[item.produtoId].custoTotal += item.quantidade * (item.produto.custoMedio || 0);
    });
    
    // Calcular margem
    Object.values(produtosMap).forEach((p: any) => {
      p.margem = p.faturamento - p.custoTotal;
      p.margemPercentual = p.faturamento > 0 ? ((p.margem / p.faturamento) * 100).toFixed(2) : 0;
    });
    
    const ranking = Object.values(produtosMap)
      .sort((a: any, b: any) => b.quantidadeVendida - a.quantidadeVendida)
      .slice(0, parseInt(String(limite)));
    
    res.json(ranking);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar produtos mais vendidos' });
  }
});

// GET - Faturamento por período
router.get('/faturamento', async (req: Request, res: Response) => {
  try {
    const { periodo = 'dia', dataInicio, dataFim } = req.query;
    
    const filtroData: any = {};
    if (dataInicio) filtroData.gte = new Date(String(dataInicio));
    if (dataFim) filtroData.lte = new Date(String(dataFim));
    
    const whereClause: any = { status: 'FECHADA' };
    if (Object.keys(filtroData).length > 0) {
      whereClause.dataFechamento = filtroData;
    }
    
    const comandas = await prisma.comanda.findMany({
      where: whereClause,
      orderBy: { dataFechamento: 'asc' }
    });
    
    const faturamentoPorPeriodo: { [key: string]: number } = {};
    
    comandas.forEach(comanda => {
      let chave: string;
      const data = comanda.dataFechamento!;
      
      switch (periodo) {
        case 'mes':
          chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'semana':
          // Simplificado - agrupa por semana do ano
          const primeiroDia = new Date(data.getFullYear(), 0, 1);
          const dias = Math.floor((data.getTime() - primeiroDia.getTime()) / (24 * 60 * 60 * 1000));
          const semana = Math.ceil(dias / 7);
          chave = `${data.getFullYear()}-S${semana}`;
          break;
        default: // dia
          chave = data.toISOString().split('T')[0];
      }
      
      if (!faturamentoPorPeriodo[chave]) {
        faturamentoPorPeriodo[chave] = 0;
      }
      faturamentoPorPeriodo[chave] += comanda.total;
    });
    
    const resultado = Object.entries(faturamentoPorPeriodo).map(([periodo, valor]) => ({
      periodo,
      faturamento: parseFloat(valor.toFixed(2))
    }));
    
    res.json(resultado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar faturamento' });
  }
});

// GET - Margem de lucro
router.get('/margem-lucro', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;
    
    const filtroData: any = {};
    if (dataInicio) filtroData.gte = new Date(String(dataInicio));
    if (dataFim) filtroData.lte = new Date(String(dataFim));
    
    const whereClause: any = { status: 'FECHADA' };
    if (Object.keys(filtroData).length > 0) {
      whereClause.dataFechamento = filtroData;
    }
    
    const itens = await prisma.itemComanda.findMany({
      where: { comanda: whereClause },
      include: {
        produto: {
          select: { custoMedio: true }
        }
      }
    });
    
    let faturamentoTotal = 0;
    let custoTotal = 0;
    
    itens.forEach(item => {
      faturamentoTotal += item.subtotal;
      custoTotal += item.quantidade * (item.produto.custoMedio || 0);
    });
    
    const lucro = faturamentoTotal - custoTotal;
    const margemPercentual = faturamentoTotal > 0 ? (lucro / faturamentoTotal) * 100 : 0;
    
    res.json({
      faturamentoTotal: parseFloat(faturamentoTotal.toFixed(2)),
      custoTotal: parseFloat(custoTotal.toFixed(2)),
      lucro: parseFloat(lucro.toFixed(2)),
      margemPercentual: parseFloat(margemPercentual.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular margem de lucro' });
  }
});

export default router;
