import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// POST - Criar despesa
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      descricao,
      valor,
      categoria,
      tipo,
      data,
      isRecorrente,
      mesesRecorrencia,
      mesInicio,
      anoInicio,
      observacao
    } = req.body;

    if (!descricao || !valor || !categoria || !tipo || !data) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const despesa = await prisma.despesa.create({
      data: {
        descricao,
        valor: parseFloat(valor),
        categoria,
        tipo,
        data: new Date(data),
        isRecorrente,
        mesesRecorrencia: isRecorrente ? mesesRecorrencia : null,
        mesInicio: isRecorrente ? mesInicio : null,
        anoInicio: isRecorrente ? anoInicio : null,
        observacao
      }
    });

    res.status(201).json(despesa);
  } catch (error: any) {
    console.error('Erro ao criar despesa:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar despesa' });
  }
});

// GET - Listar despesas com filtros
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tipo, categoria, mes, ano, paga } = req.query;

    const where: any = {};

    if (tipo) where.tipo = String(tipo);
    if (categoria) where.categoria = String(categoria);
    if (paga !== undefined) where.paga = paga === 'true';

    // Filtrar por mês/ano se fornecido
    if (mes && ano) {
      const mesNum = parseInt(String(mes));
      const anoNum = parseInt(String(ano));

      const dataInicio = new Date(anoNum, mesNum - 1, 1);
      const dataFim = new Date(anoNum, mesNum, 0);

      where.data = {
        gte: dataInicio,
        lte: dataFim
      };
    }

    const despesas = await prisma.despesa.findMany({
      where,
      orderBy: { data: 'desc' }
    });

    res.json(despesas);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao listar despesas' });
  }
});

// GET - Despesa por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const despesa = await prisma.despesa.findUnique({
      where: { id }
    });

    if (!despesa) {
      return res.status(404).json({ error: 'Despesa não encontrada' });
    }

    res.json(despesa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar despesa' });
  }
});

// PUT - Atualizar despesa
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      descricao,
      valor,
      categoria,
      tipo,
      data,
      observacao,
      paga,
      dataPagamento
    } = req.body;

    const despesa = await prisma.despesa.update({
      where: { id },
      data: {
        ...(descricao && { descricao }),
        ...(valor !== undefined && { valor: parseFloat(valor) }),
        ...(categoria && { categoria }),
        ...(tipo && { tipo }),
        ...(data && { data: new Date(data) }),
        ...(observacao !== undefined && { observacao }),
        ...(paga !== undefined && { paga }),
        ...(dataPagamento && { dataPagamento: new Date(dataPagamento) })
      }
    });

    res.json(despesa);
  } catch (error: any) {
    console.error('Erro ao atualizar despesa:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar despesa' });
  }
});

// DELETE - Deletar despesa
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.despesa.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar despesa:', error);
    res.status(500).json({ error: 'Erro ao deletar despesa' });
  }
});

// GET - Relatório de despesas (por categoria, total por mês, etc)
router.get('/relatorio/resumo', async (req: Request, res: Response) => {
  try {
    const { mes, ano } = req.query;

    let where: any = {
      paga: true // Apenas despesas pagas
    };

    if (mes && ano) {
      const mesNum = parseInt(String(mes));
      const anoNum = parseInt(String(ano));

      const dataInicio = new Date(anoNum, mesNum - 1, 1);
      dataInicio.setHours(0, 0, 0, 0);
      
      const dataFim = new Date(anoNum, mesNum, 0);
      dataFim.setHours(23, 59, 59, 999);

      where.data = {
        gte: dataInicio,
        lte: dataFim
      };
    }

    const despesas = await prisma.despesa.findMany({
      where,
      orderBy: { data: 'desc' }
    });

    // Calcular total
    const total = despesas.reduce((sum, d) => sum + d.valor, 0);

    // Agrupar por tipo
    const fixa = despesas
      .filter(d => d.tipo === 'FIXA')
      .reduce((sum, d) => sum + d.valor, 0);
    
    const variavel = despesas
      .filter(d => d.tipo === 'VARIÁVEL')
      .reduce((sum, d) => sum + d.valor, 0);

    // Agrupar por categoria (apenas o total)
    const por_categoria: any = {};
    despesas.forEach(d => {
      if (!por_categoria[d.categoria]) {
        por_categoria[d.categoria] = 0;
      }
      por_categoria[d.categoria] += d.valor;
    });

    res.json({
      periodo: `${mes}/${ano}`,
      total,
      fixa,
      variavel,
      por_categoria,
      despesas
    });
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

export default router;
