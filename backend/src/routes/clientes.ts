import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET - Listar todos os clientes
router.get('/', async (req: Request, res: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { ativo: true },
      orderBy: { totalGasto: 'desc' },
      select: {
        id: true,
        nomeCompleto: true,
        telefone: true,
        cpf: true,
        totalGasto: true,
        qtdComandas: true,
        criadoEm: true,
        atualizadoEm: true
      }
    });
    res.json(clientes);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar clientes' });
  }
});

// GET - Obter cliente por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        comandas: {
          orderBy: { dataAbertura: 'desc' },
          take: 10
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.json(cliente);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao obter cliente' });
  }
});

// POST - Criar novo cliente
router.post('/', async (req: Request, res: Response) => {
  try {
    const { nomeCompleto, telefone, cpf } = req.body;

    // Validar nome obrigatório
    if (!nomeCompleto || nomeCompleto.trim() === '') {
      return res.status(400).json({ error: 'Nome completo é obrigatório' });
    }

    // Verificar CPF único se fornecido
    if (cpf) {
      const clienteExistente = await prisma.cliente.findUnique({
        where: { cpf }
      });
      if (clienteExistente) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
    }

    const cliente = await prisma.cliente.create({
      data: {
        nomeCompleto: nomeCompleto.trim(),
        telefone: telefone?.trim() || null,
        cpf: cpf?.trim() || null
      }
    });

    res.status(201).json(cliente);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar cliente' });
  }
});

// PUT - Atualizar cliente
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nomeCompleto, telefone, cpf } = req.body;

    // Validar nome obrigatório
    if (nomeCompleto && nomeCompleto.trim() === '') {
      return res.status(400).json({ error: 'Nome completo é obrigatório' });
    }

    // Verificar CPF único se fornecido e diferente do atual
    if (cpf) {
      const clienteExistente = await prisma.cliente.findUnique({
        where: { cpf }
      });
      if (clienteExistente && clienteExistente.id !== id) {
        return res.status(400).json({ error: 'CPF já cadastrado' });
      }
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        ...(nomeCompleto && { nomeCompleto: nomeCompleto.trim() }),
        ...(telefone !== undefined && { telefone: telefone?.trim() || null }),
        ...(cpf !== undefined && { cpf: cpf?.trim() || null })
      }
    });

    res.json(cliente);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.status(500).json({ error: error.message || 'Erro ao atualizar cliente' });
  }
});

// DELETE - Deletar cliente (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.cliente.update({
      where: { id },
      data: { ativo: false }
    });

    res.json({ message: 'Cliente deletado com sucesso' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    res.status(500).json({ error: error.message || 'Erro ao deletar cliente' });
  }
});

export default router;
