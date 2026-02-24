import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET - Dashboard geral (comandas abertas do dia)
router.get('/inicio', async (req: Request, res: Response) => {
  try {
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    // Comandas abertas
    const comandas = await prisma.comanda.findMany({
      where: {
        status: 'ABERTA',
        dataAbertura: {
          gte: inicioHoje,
          lte: fimHoje
        }
      },
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

    // Produtos mais vendidos hoje
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

    res.json({
      resumo: {
        totalComandas,
        faturamentoTotal: parseFloat(faturamentoTotal.toFixed(2)),
        ticketMedio: parseFloat(ticketMedio.toFixed(2))
      },
      topProdutos
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao gerar início' });
  }
});

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

// GET - Resumo completo (faturamento, despesas e lucro líquido)
router.get('/resumo', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;

    const filtroData: any = {};
    if (dataInicio) {
      const inicio = new Date(String(dataInicio));
      inicio.setHours(0, 0, 0, 0);
      filtroData.gte = inicio;
    }
    if (dataFim) {
      const fim = new Date(String(dataFim));
      fim.setHours(23, 59, 59, 999);
      filtroData.lte = fim;
    }

    // ========== COMANDAS ==========
    const whereComandas: any = { status: 'FECHADA' };
    if (Object.keys(filtroData).length > 0) {
      whereComandas.dataFechamento = filtroData;
    }

    // Buscar comandas fechadas no período
    const comandas = await prisma.comanda.findMany({
      where: whereComandas,
      include: {
        itens: {
          include: {
            produto: {
              select: { custoMedio: true }
            }
          }
        }
      }
    });

    let faturamentoComandas = 0;
    let custoComandas = 0;

    comandas.forEach(comanda => {
      comanda.itens.forEach(item => {
        // Faturamento: EXCLUI itens abonados (não foram pagos)
        if (!item.abonado) {
          faturamentoComandas += item.subtotal;
        }
        // Custo: INCLUI todos os itens (mesmo abonados, pois a empresa teve o custo)
        custoComandas += item.quantidade * (item.produto.custoMedio || 0);
      });
    });

    // ========== VENDAS PDV ==========
    const whereVendas: any = { status: 'FINALIZADA' };
    if (Object.keys(filtroData).length > 0) {
      whereVendas.dataFechamento = filtroData;
    }

    // Buscar vendas finalizadas no período
    const vendas = await prisma.venda.findMany({
      where: whereVendas,
      include: {
        itens: {
          include: {
            produto: {
              select: { custoMedio: true }
            }
          }
        }
      }
    });

    let faturamentoVendas = 0;
    let custoVendas = 0;

    vendas.forEach(venda => {
      venda.itens.forEach(item => {
        faturamentoVendas += item.subtotal;
        custoVendas += item.quantidade * (item.produto.custoMedio || 0);
      });
    });

    // ========== TOTAIS ==========
    const faturamentoTotal = faturamentoComandas + faturamentoVendas;
    const custoTotal = custoComandas + custoVendas;
    const lucroGrosso = faturamentoTotal - custoTotal;
    const margemGrossa = faturamentoTotal > 0 ? (lucroGrosso / faturamentoTotal) * 100 : 0;

    // Despesas
    const despesasData = await prisma.despesa.findMany({
      where: {
        paga: true,
        ...(Object.keys(filtroData).length > 0 && {
          data: filtroData
        })
      }
    });

    const despesasTotal = despesasData.reduce((acc, d) => acc + d.valor, 0);

    // Lucro líquido (faturamento - custo dos produtos - despesas)
    const lucroLiquido = faturamentoTotal - custoTotal - despesasTotal;
    const margemLiquida = faturamentoTotal > 0 ? (lucroLiquido / faturamentoTotal) * 100 : 0;

    // Custos e valores de estoque
    const produtos = await prisma.produto.findMany({
      select: {
        custoMedio: true,
        precoVenda: true,
        estoque: {
          select: {
            quantidade: true
          }
        }
      }
    });

    let custoEstoque = 0;
    let valorEstoqueVenda = 0;

    produtos.forEach(produto => {
      const saldoEstoque = produto.estoque?.quantidade || 0;
      custoEstoque += (produto.custoMedio || 0) * saldoEstoque;
      valorEstoqueVenda += (produto.precoVenda || 0) * saldoEstoque;
    });

    res.json({
      faturamentoTotal: parseFloat(faturamentoTotal.toFixed(2)),
      faturamentoComandas: parseFloat(faturamentoComandas.toFixed(2)),
      faturamentoVendas: parseFloat(faturamentoVendas.toFixed(2)),
      custoTotal: parseFloat(custoTotal.toFixed(2)),
      custoComandas: parseFloat(custoComandas.toFixed(2)),
      custoVendas: parseFloat(custoVendas.toFixed(2)),
      despesasTotal: parseFloat(despesasTotal.toFixed(2)),
      lucroGrosso: parseFloat(lucroGrosso.toFixed(2)),
      margemGrossa: parseFloat(margemGrossa.toFixed(2)),
      lucroLiquido: parseFloat(lucroLiquido.toFixed(2)),
      margemLiquida: parseFloat(margemLiquida.toFixed(2)),
      custoEstoque: parseFloat(custoEstoque.toFixed(2)),
      valorEstoqueVenda: parseFloat(valorEstoqueVenda.toFixed(2))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao gerar resumo' });
  }
});

// GET - Dados mensais para gráficos
router.get('/mensal', async (req: Request, res: Response) => {
  try {
    const { meses = 12 } = req.query;
    const numMeses = parseInt(String(meses));

    // Array para armazenar dados de cada mês
    const dadosMensais: any[] = [];

    // Gerar dados para os últimos N meses
    for (let i = numMeses - 1; i >= 0; i--) {
      const dataAtual = new Date();
      dataAtual.setMonth(dataAtual.getMonth() - i);
      
      const mes = dataAtual.getMonth() + 1;
      const ano = dataAtual.getFullYear();
      const mesNome = dataAtual.toLocaleString('pt-BR', { month: 'short', year: 'numeric' });

      // Faturamento do mês
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59);

      const itens = await prisma.itemComanda.findMany({
        where: {
          comanda: {
            status: 'FECHADA',
            dataFechamento: {
              gte: inicioMes,
              lte: fimMes
            }
          }
        },
        include: {
          produto: {
            select: { custoMedio: true }
          }
        }
      });

      let faturamentoMes = 0;
      let custoMes = 0;

      itens.forEach(item => {
        faturamentoMes += item.subtotal;
        custoMes += item.quantidade * (item.produto.custoMedio || 0);
      });

      // Despesas do mês
      const despesasMes = await prisma.despesa.findMany({
        where: {
          paga: true,
          data: {
            gte: inicioMes,
            lte: fimMes
          }
        }
      });

      const despesasTotal = despesasMes.reduce((acc, d) => acc + d.valor, 0);

      const lucroGrosso = faturamentoMes - custoMes;
      const lucroLiquido = faturamentoMes - custoMes - despesasTotal;
      const margemGrossa = faturamentoMes > 0 ? (lucroGrosso / faturamentoMes) * 100 : 0;
      const margemLiquida = faturamentoMes > 0 ? (lucroLiquido / faturamentoMes) * 100 : 0;

      dadosMensais.push({
        mes: mesNome,
        faturamento: parseFloat(faturamentoMes.toFixed(2)),
        despesas: parseFloat(despesasTotal.toFixed(2)),
        lucroGrosso: parseFloat(lucroGrosso.toFixed(2)),
        lucroLiquido: parseFloat(lucroLiquido.toFixed(2)),
        margemGrossa: parseFloat(margemGrossa.toFixed(2)),
        margemLiquida: parseFloat(margemLiquida.toFixed(2))
      });
    }

    res.json(dadosMensais);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao gerar dados mensais' });
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

// GET - Top clientes
router.get('/top-clientes/ranking', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim, limite = 10 } = req.query;

    const filtroData: any = {};
    if (dataInicio) filtroData.gte = new Date(String(dataInicio));
    if (dataFim) filtroData.lte = new Date(String(dataFim));

    const whereClause: any = { status: 'FECHADA' };
    if (Object.keys(filtroData).length > 0) {
      whereClause.dataFechamento = filtroData;
    }

    const comandas = await prisma.comanda.findMany({
      where: whereClause,
      include: {
        cliente: true
      }
    });

    // Agrupar por cliente
    const clientesMap: { [key: string]: any } = {};

    comandas.forEach(comanda => {
      const chaveCliente = comanda.clienteId || 'Cliente não cadastrado';
      const nomeCliente = comanda.cliente?.nomeCompleto || comanda.nomeCliente;

      if (!clientesMap[chaveCliente]) {
        clientesMap[chaveCliente] = {
          clienteId: comanda.clienteId,
          nomeCliente,
          totalGasto: 0,
          qtdComandas: 0
        };
      }

      clientesMap[chaveCliente].totalGasto += comanda.total;
      clientesMap[chaveCliente].qtdComandas += 1;
    });

    // Converter para array e ordenar
    const ranking = Object.values(clientesMap)
      .sort((a: any, b: any) => b.totalGasto - a.totalGasto)
      .slice(0, parseInt(String(limite)));

    res.json(ranking);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar top clientes' });
  }
});

// GET - KPI Faturamento Abonado
router.get('/vendas/faturamento-abonado', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;

    let filtro: any = {};

    // Se não informar datas, usa último mês
    if (dataInicio && dataFim) {
      filtro.criadoEm = {
        gte: new Date(String(dataInicio)),
        lte: new Date(String(dataFim))
      };
    } else {
      const hoje = new Date();
      const inicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
      filtro.criadoEm = {
        gte: inicio,
        lte: hoje
      };
    }

    // Buscar itens abonados
    const itensAbonados = await prisma.itemComanda.findMany({
      where: {
        abonado: true,
        ...filtro
      },
      include: {
        comanda: true
      }
    });

    // Buscar todos os itens no período para calcular percentual
    const todosItens = await prisma.itemComanda.findMany({
      where: filtro,
      include: {
        comanda: true
      }
    });

    // Calcular totais
    const totalAbonado = itensAbonados.reduce((sum, item) => sum + item.subtotal, 0);
    const custoTotal = itensAbonados.reduce((sum, item) => sum + (item.custoUnitario * item.quantidade), 0);
    const totalFaturado = todosItens
      .filter(i => !i.abonado)
      .reduce((sum, item) => sum + item.subtotal, 0);
    const totalGeralVendido = todosItens.reduce((sum, item) => sum + item.subtotal, 0);

    const percentualAbonado = totalGeralVendido > 0 ? (totalAbonado / totalGeralVendido) * 100 : 0;
    const qtdItensAbonados = itensAbonados.length;

    // Gráfico: Evolução diária
    const graficoDiario: { [key: string]: number } = {};
    itensAbonados.forEach(item => {
      const data = new Date(item.criadoEm).toISOString().split('T')[0];
      graficoDiario[data] = (graficoDiario[data] || 0) + item.subtotal;
    });

    res.json({
      totalAbonado: Math.round(totalAbonado * 100) / 100,
      custoTotal: Math.round(custoTotal * 100) / 100,
      percentualAbonado: Math.round(percentualAbonado * 100) / 100,
      qtdItensAbonados,
      totalFaturado: Math.round(totalFaturado * 100) / 100,
      totalGeralVendido: Math.round(totalGeralVendido * 100) / 100,
      graficoDiario
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar KPI faturamento abonado' });
  }
});

// GET - Histórico de comandas com itens detalhados
router.get('/historico-comandas', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;

    let filtroData: any = {};
    if (dataInicio && dataFim) {
      const inicio = new Date(String(dataInicio));
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(String(dataFim));
      fim.setHours(23, 59, 59, 999);
      filtroData = {
        gte: inicio,
        lte: fim
      };
    } else {
      // Se não informar datas, últimos 30 dias
      const hoje = new Date();
      const inicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtroData = {
        gte: inicio,
        lte: hoje
      };
    }

    const comandas = await prisma.comanda.findMany({
      where: {
        status: 'FECHADA',
        dataFechamento: filtroData
      },
      include: {
        itens: {
          include: {
            produto: {
              select: { nome: true }
            }
          }
        }
      },
      orderBy: { dataFechamento: 'desc' }
    });

    // Formatar dados em linhas por item
    const historico = comandas.flatMap(comanda => 
      comanda.itens.map(item => ({
        numeroComanda: comanda.numeroComanda,
        nomeCliente: comanda.nomeCliente,
        nomeProduto: item.nomeProduto,
        quantidade: item.quantidade,
        abonado: item.abonado,
        subtotal: Math.round(item.subtotal * 100) / 100,
        dataFechamento: comanda.dataFechamento
      }))
    );

    res.json(historico);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar histórico de comandas' });
  }
});

// GET - Histórico de partidas de sinuca com filtros
router.get('/historico-partidas', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim, jogadorId, status, torneioId } = req.query;

    let filtro: any = {};

    // Filtro de data
    if (dataInicio || dataFim) {
      filtro.dataCriacao = {};
      if (dataInicio) {
        const inicio = new Date(String(dataInicio));
        inicio.setHours(0, 0, 0, 0);
        filtro.dataCriacao.gte = inicio;
      }
      if (dataFim) {
        const fim = new Date(String(dataFim));
        fim.setHours(23, 59, 59, 999);
        filtro.dataCriacao.lte = fim;
      }
    }

    // Filtro de status
    if (status && status !== 'TODOS') {
      filtro.status = String(status);
    }

    // Filtro de jogador
    if (jogadorId && jogadorId !== '') {
      filtro.OR = [
        { jogador1Id: String(jogadorId) },
        { jogador2Id: String(jogadorId) }
      ];
    }

    // Filtro de torneio
    if (torneioId && torneioId !== '') {
      filtro.torneioId = String(torneioId);
    }

    const partidas = await prisma.sinucaPartida.findMany({
      where: filtro,
      include: {
        jogador1: { select: { id: true, nome: true } },
        jogador2: { select: { id: true, nome: true } },
        torneio: { select: { id: true, nome: true } }
      },
      orderBy: { dataCriacao: 'desc' }
    });

    const historicoFormatado = partidas.map(partida => {
      const resultado = partida.statusPartida === 'FINALIZADA' 
        ? partida.placar1 > partida.placar2 
          ? `${partida.jogador1.nome} (${partida.placar1}x${partida.placar2})`
          : `${partida.jogador2.nome} (${partida.placar2}x${partida.placar1})`
        : 'Em andamento';

      return {
        id: partida.id,
        jogador1: partida.jogador1.nome,
        jogador2: partida.jogador2.nome,
        placar1: partida.placar1,
        placar2: partida.placar2,
        resultado,
        tipo: partida.tipo,
        melhorDe: partida.melhorDe,
        status: partida.statusPartida,
        torneio: partida.torneio?.nome || 'Partida Única',
        dataCriacao: partida.dataCriacao
      };
    });

    res.json(historicoFormatado);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar histórico de partidas' });
  }
});

// GET - KPIs de Sinuca
router.get('/kpi-sinuca', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim } = req.query;

    let filtro: any = { statusPartida: 'FINALIZADA' };

    // Filtro de data
    if (dataInicio || dataFim) {
      filtro.dataCriacao = {};
      if (dataInicio) {
        const inicio = new Date(String(dataInicio));
        inicio.setHours(0, 0, 0, 0);
        filtro.dataCriacao.gte = inicio;
      }
      if (dataFim) {
        const fim = new Date(String(dataFim));
        fim.setHours(23, 59, 59, 999);
        filtro.dataCriacao.lte = fim;
      }
    } else {
      // Por padrão, últimos 30 dias
      const hoje = new Date();
      const inicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtro.dataCriacao = {
        gte: inicio,
        lte: hoje
      };
    }

    const partidas = await prisma.sinucaPartida.findMany({
      where: filtro,
      include: {
        jogador1: { select: { id: true, nome: true } },
        jogador2: { select: { id: true, nome: true } }
      }
    });

    // Calcular estatísticas
    const totalPartidas = partidas.length;

    // Vitorias por jogador
    const vitoriasPorJogador: { [key: string]: { nome: string; vitorias: number; derrotas: number; taxaVitoria: number } } = {};

    partidas.forEach(partida => {
      const j1 = partida.jogador1;
      const j2 = partida.jogador2;

      if (!vitoriasPorJogador[j1.id]) {
        vitoriasPorJogador[j1.id] = { nome: j1.nome, vitorias: 0, derrotas: 0, taxaVitoria: 0 };
      }
      if (!vitoriasPorJogador[j2.id]) {
        vitoriasPorJogador[j2.id] = { nome: j2.nome, vitorias: 0, derrotas: 0, taxaVitoria: 0 };
      }

      if (partida.placar1 > partida.placar2) {
        vitoriasPorJogador[j1.id].vitorias++;
        vitoriasPorJogador[j2.id].derrotas++;
      } else {
        vitoriasPorJogador[j2.id].vitorias++;
        vitoriasPorJogador[j1.id].derrotas++;
      }
    });

    // Calcular taxa de vitória
    Object.values(vitoriasPorJogador).forEach(jogador => {
      const totalPartidasJogador = jogador.vitorias + jogador.derrotas;
      jogador.taxaVitoria = totalPartidasJogador > 0 
        ? Math.round((jogador.vitorias / totalPartidasJogador) * 100)
        : 0;
    });

    // Ranking de vencedores
    const ranking = Object.values(vitoriasPorJogador)
      .sort((a, b) => b.vitorias - a.vitorias)
      .slice(0, 10);

    // Tipos de partidas
    const tiposPartidas: { [key: string]: number } = {};
    partidas.forEach(p => {
      const tipo = p.tipo === 'UNICA' ? 'Partida Única' : `Melhor de ${p.melhorDe}`;
      tiposPartidas[tipo] = (tiposPartidas[tipo] || 0) + 1;
    });

    // Jogador mais vitorioso
    const jogadorMaisVitorioso = ranking.length > 0 ? ranking[0] : null;

    // Taxa média de vitória
    const taxaMediaVitoria = Object.values(vitoriasPorJogador).length > 0
      ? Math.round(
          Object.values(vitoriasPorJogador).reduce((sum, j) => sum + j.taxaVitoria, 0) / 
          Object.values(vitoriasPorJogador).length
        )
      : 0;

    res.json({
      resumo: {
        totalPartidas,
        totalJogadores: Object.keys(vitoriasPorJogador).length,
        taxaMediaVitoria,
        jogadorMaisVitorioso
      },
      ranking,
      tiposPartidas,
      periodo: {
        dataInicio: filtro.dataCriacao?.gte || 'Sem data inicial',
        dataFim: filtro.dataCriacao?.lte || 'Sem data final'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar KPI de sinuca' });
  }
});

// GET - Histórico de vendas do PDV
router.get('/historico-vendas', async (req: Request, res: Response) => {
  try {
    const { dataInicio, dataFim, clienteId, status } = req.query;

    let filtroData: any = {};
    if (dataInicio && dataFim) {
      const inicio = new Date(String(dataInicio));
      inicio.setHours(0, 0, 0, 0);
      const fim = new Date(String(dataFim));
      fim.setHours(23, 59, 59, 999);
      filtroData = {
        gte: inicio,
        lte: fim
      };
    } else {
      // Se não informar datas, últimos 30 dias
      const hoje = new Date();
      const inicio = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtroData = {
        gte: inicio,
        lte: hoje
      };
    }

    const whereClause: any = {
      status: status && status !== 'TODOS' ? String(status) : { in: ['FINALIZADA', 'CANCELADA'] },
      dataFechamento: filtroData
    };

    // Filtro de cliente
    if (clienteId && clienteId !== '') {
      whereClause.clienteId = String(clienteId);
    }

    const vendas = await prisma.venda.findMany({
      where: whereClause,
      include: {
        itens: {
          include: {
            produto: {
              select: { nome: true }
            }
          }
        },
        cliente: {
          select: { nomeCompleto: true }
        }
      },
      orderBy: { dataFechamento: 'desc' }
    });

    // Formatar dados em linhas por item
    const historico = vendas.flatMap(venda => 
      venda.itens.map(item => ({
        numeroVenda: venda.numeroVenda,
        nomeCliente: venda.nomeCliente || venda.cliente?.nomeCompleto || 'Cliente Avulso',
        nomeProduto: item.nomeProduto,
        quantidade: item.quantidade,
        precoUnitario: Math.round(item.precoUnitario * 100) / 100,
        desconto: Math.round(item.desconto * 100) / 100,
        subtotal: Math.round(item.subtotal * 100) / 100,
        tipoPagamento: venda.tipoPagamento,
        status: venda.status,
        dataFechamento: venda.dataFechamento
      }))
    );

    res.json(historico);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar histórico de vendas' });
  }
});

export default router;

