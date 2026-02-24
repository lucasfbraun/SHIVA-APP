import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

type PartidaTipo = 'UNICA' | 'MELHOR_DE';
type TorneioTipo = 'TODOS_CONTRA_TODOS' | 'CHAVEAMENTO';

const normalizarTipoPartida = (tipo: string | undefined): PartidaTipo => {
  const value = String(tipo || 'UNICA').toUpperCase();
  return value === 'MELHOR_DE' ? 'MELHOR_DE' : 'UNICA';
};

const normalizarTipoTorneio = (tipo: string | undefined): TorneioTipo => {
  const value = String(tipo || 'TODOS_CONTRA_TODOS').toUpperCase();
  return value === 'CHAVEAMENTO' ? 'CHAVEAMENTO' : 'TODOS_CONTRA_TODOS';
};

const validarMelhorDe = (tipo: PartidaTipo, melhorDe?: number): number => {
  if (tipo === 'UNICA') {
    return 1;
  }
  const valor = Number(melhorDe);
  if (!Number.isInteger(valor) || valor < 3 || valor % 2 === 0) {
    throw new Error('Melhor de deve ser um numero impar maior ou igual a 3');
  }
  return valor;
};

const calcularVencedor = (melhorDe: number, vitoriasA: number, vitoriasB: number) => {
  const necessario = Math.floor(melhorDe / 2) + 1;
  if (vitoriasA >= necessario) {
    return 'A';
  }
  if (vitoriasB >= necessario) {
    return 'B';
  }
  return null;
};

router.get('/partidas', async (req: Request, res: Response) => {
  try {
    const partidas = await prisma.sinucaPartida.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        clienteA: { select: { id: true, nomeCompleto: true } },
        clienteB: { select: { id: true, nomeCompleto: true } },
        vencedor: { select: { id: true, nomeCompleto: true } }
      }
    });
    res.json(partidas);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar partidas' });
  }
});

router.get('/partidas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partida = await prisma.sinucaPartida.findUnique({
      where: { id },
      include: {
        clienteA: { select: { id: true, nomeCompleto: true } },
        clienteB: { select: { id: true, nomeCompleto: true } },
        vencedor: { select: { id: true, nomeCompleto: true } }
      }
    });

    if (!partida) {
      return res.status(404).json({ error: 'Partida nao encontrada' });
    }

    res.json(partida);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar partida' });
  }
});

router.post('/partidas', async (req: Request, res: Response) => {
  try {
    const { clienteAId, clienteBId, tipo, melhorDe, observacao } = req.body;

    if (!clienteAId || !clienteBId) {
      return res.status(400).json({ error: 'Jogadores sao obrigatorios' });
    }
    if (clienteAId === clienteBId) {
      return res.status(400).json({ error: 'Jogadores precisam ser diferentes' });
    }

    const tipoNormalizado = normalizarTipoPartida(tipo);
    const melhorDeNormalizado = validarMelhorDe(tipoNormalizado, melhorDe);

    const clientes = await prisma.cliente.findMany({
      where: { id: { in: [clienteAId, clienteBId] }, ativo: true },
      select: { id: true }
    });

    if (clientes.length !== 2) {
      return res.status(400).json({ error: 'Clientes invalidos ou inativos' });
    }

    const partida = await prisma.sinucaPartida.create({
      data: {
        tipo: tipoNormalizado,
        melhorDe: melhorDeNormalizado,
        clienteAId,
        clienteBId,
        observacao: observacao?.trim() || null,
        status: 'PENDENTE'
      },
      include: {
        clienteA: { select: { id: true, nomeCompleto: true } },
        clienteB: { select: { id: true, nomeCompleto: true } }
      }
    });

    res.status(201).json(partida);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar partida' });
  }
});

router.put('/partidas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { vitoriasA, vitoriasB, status } = req.body;

    const partida = await prisma.sinucaPartida.findUnique({ where: { id } });
    if (!partida) {
      return res.status(404).json({ error: 'Partida nao encontrada' });
    }
    if (partida.status === 'FINALIZADA') {
      return res.status(400).json({ error: 'Partida ja finalizada' });
    }

    const novoA = vitoriasA !== undefined ? Number(vitoriasA) : partida.vitoriasA;
    const novoB = vitoriasB !== undefined ? Number(vitoriasB) : partida.vitoriasB;

    if (novoA < 0 || novoB < 0 || novoA > partida.melhorDe || novoB > partida.melhorDe) {
      return res.status(400).json({ error: 'Placar invalido' });
    }

    const resultado = calcularVencedor(partida.melhorDe, novoA, novoB);
    const statusNormalizado = status ? String(status).toUpperCase() : partida.status;
    const finalizada = resultado !== null;

    const atualizada = await prisma.sinucaPartida.update({
      where: { id },
      data: {
        vitoriasA: novoA,
        vitoriasB: novoB,
        status: finalizada ? 'FINALIZADA' : statusNormalizado,
        vencedorId: finalizada
          ? (resultado === 'A' ? partida.clienteAId : partida.clienteBId)
          : null,
        finalizadoEm: finalizada ? new Date() : null
      },
      include: {
        clienteA: { select: { id: true, nomeCompleto: true } },
        clienteB: { select: { id: true, nomeCompleto: true } },
        vencedor: { select: { id: true, nomeCompleto: true } }
      }
    });

    res.json(atualizada);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar partida' });
  }
});

router.get('/torneios', async (req: Request, res: Response) => {
  try {
    const torneios = await prisma.sinucaTorneio.findMany({
      orderBy: { criadoEm: 'desc' },
      select: {
        id: true,
        nome: true,
        tipo: true,
        melhorDe: true,
        status: true,
        criadoEm: true,
        atualizadoEm: true,
        _count: { select: { participantes: true, partidas: true } }
      }
    });

    res.json(torneios);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao listar torneios' });
  }
});

router.get('/torneios/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const torneio = await prisma.sinucaTorneio.findUnique({
      where: { id },
      include: {
        participantes: {
          include: {
            cliente: { select: { id: true, nomeCompleto: true } }
          },
          orderBy: { pontos: 'desc' }
        },
        partidas: {
          include: {
            clienteA: { select: { id: true, nomeCompleto: true } },
            clienteB: { select: { id: true, nomeCompleto: true } },
            vencedor: { select: { id: true, nomeCompleto: true } }
          },
          orderBy: [{ rodada: 'asc' }, { criadoEm: 'asc' }]
        }
      }
    });

    if (!torneio) {
      return res.status(404).json({ error: 'Torneio nao encontrado' });
    }

    res.json(torneio);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao buscar torneio' });
  }
});

router.post('/torneios', async (req: Request, res: Response) => {
  try {
    const { nome, tipo, melhorDe, participantes } = req.body;

    if (!nome || String(nome).trim() === '') {
      return res.status(400).json({ error: 'Nome do torneio e obrigatorio' });
    }

    const tipoNormalizado = normalizarTipoTorneio(tipo);
    const idsParticipantes = Array.isArray(participantes)
      ? Array.from(new Set(participantes.filter((id) => Boolean(id))))
      : [];

    if (idsParticipantes.length < 2) {
      return res.status(400).json({ error: 'Selecione ao menos 2 participantes' });
    }

    if (tipoNormalizado === 'CHAVEAMENTO' && idsParticipantes.length % 2 !== 0) {
      return res.status(400).json({ error: 'Chaveamento exige numero par de participantes' });
    }

    const melhorDeNormalizado = validarMelhorDe('MELHOR_DE', melhorDe);

    const clientes = await prisma.cliente.findMany({
      where: { id: { in: idsParticipantes }, ativo: true },
      select: { id: true }
    });

    if (clientes.length !== idsParticipantes.length) {
      return res.status(400).json({ error: 'Participantes invalidos ou inativos' });
    }

    const torneio = await prisma.$transaction(async (tx) => {
      const novoTorneio = await tx.sinucaTorneio.create({
        data: {
          nome: String(nome).trim(),
          tipo: tipoNormalizado,
          melhorDe: melhorDeNormalizado,
          status: 'EM_ANDAMENTO',
          participantes: {
            create: idsParticipantes.map((clienteId: string) => ({
              clienteId
            }))
          }
        }
      });

      const partidasData: Array<{
        torneioId: string;
        rodada: number;
        clienteAId: string;
        clienteBId: string;
        melhorDe: number;
      }> = [];

      if (tipoNormalizado === 'TODOS_CONTRA_TODOS') {
        let rodada = 1;
        for (let i = 0; i < idsParticipantes.length; i += 1) {
          for (let j = i + 1; j < idsParticipantes.length; j += 1) {
            partidasData.push({
              torneioId: novoTorneio.id,
              rodada,
              clienteAId: idsParticipantes[i],
              clienteBId: idsParticipantes[j],
              melhorDe: melhorDeNormalizado
            });
            rodada += 1;
          }
        }
      } else {
        for (let i = 0; i < idsParticipantes.length; i += 2) {
          partidasData.push({
            torneioId: novoTorneio.id,
            rodada: 1,
            clienteAId: idsParticipantes[i],
            clienteBId: idsParticipantes[i + 1],
            melhorDe: melhorDeNormalizado
          });
        }
      }

      if (partidasData.length > 0) {
        await tx.sinucaTorneioPartida.createMany({ data: partidasData });
      }

      return novoTorneio;
    });

    const torneioCompleto = await prisma.sinucaTorneio.findUnique({
      where: { id: torneio.id },
      include: {
        participantes: {
          include: {
            cliente: { select: { id: true, nomeCompleto: true } }
          },
          orderBy: { pontos: 'desc' }
        },
        partidas: {
          include: {
            clienteA: { select: { id: true, nomeCompleto: true } },
            clienteB: { select: { id: true, nomeCompleto: true } },
            vencedor: { select: { id: true, nomeCompleto: true } }
          },
          orderBy: [{ rodada: 'asc' }, { criadoEm: 'asc' }]
        }
      }
    });

    res.status(201).json(torneioCompleto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar torneio' });
  }
});

router.put('/torneios/:id/partidas/:partidaId', async (req: Request, res: Response) => {
  try {
    const { id, partidaId } = req.params;
    const { vitoriasA, vitoriasB, status } = req.body;

    const resultado = await prisma.$transaction(async (tx) => {
      const partida = await tx.sinucaTorneioPartida.findUnique({
        where: { id: partidaId },
        include: { torneio: true }
      });

      if (!partida || partida.torneioId !== id) {
        throw new Error('Partida nao encontrada');
      }
      if (partida.status === 'FINALIZADA') {
        throw new Error('Partida ja finalizada');
      }

      const novoA = vitoriasA !== undefined ? Number(vitoriasA) : partida.vitoriasA;
      const novoB = vitoriasB !== undefined ? Number(vitoriasB) : partida.vitoriasB;

      if (novoA < 0 || novoB < 0 || novoA > partida.melhorDe || novoB > partida.melhorDe) {
        throw new Error('Placar invalido');
      }

      const vencedorFlag = calcularVencedor(partida.melhorDe, novoA, novoB);
      const statusNormalizado = status ? String(status).toUpperCase() : partida.status;
      const finalizada = vencedorFlag !== null;
      const vencedorId = finalizada
        ? (vencedorFlag === 'A' ? partida.clienteAId : partida.clienteBId)
        : null;

      const atualizada = await tx.sinucaTorneioPartida.update({
        where: { id: partidaId },
        data: {
          vitoriasA: novoA,
          vitoriasB: novoB,
          status: finalizada ? 'FINALIZADA' : statusNormalizado,
          vencedorId
        },
        include: {
          clienteA: { select: { id: true, nomeCompleto: true } },
          clienteB: { select: { id: true, nomeCompleto: true } },
          vencedor: { select: { id: true, nomeCompleto: true } }
        }
      });

      if (finalizada && partida.torneio.tipo === 'TODOS_CONTRA_TODOS' && vencedorId) {
        const perdedorId = vencedorId === partida.clienteAId ? partida.clienteBId : partida.clienteAId;

        await tx.sinucaTorneioParticipante.updateMany({
          where: { torneioId: id, clienteId: vencedorId },
          data: { vitorias: { increment: 1 }, pontos: { increment: 3 } }
        });

        await tx.sinucaTorneioParticipante.updateMany({
          where: { torneioId: id, clienteId: perdedorId },
          data: { derrotas: { increment: 1 } }
        });
      }

      return atualizada;
    });

    res.json(resultado);
  } catch (error: any) {
    const message = error?.message || 'Erro ao atualizar partida do torneio';
    const statusCode = message.includes('nao encontrada') ? 404 : 400;
    res.status(statusCode).json({ error: message });
  }
});

export default router;
