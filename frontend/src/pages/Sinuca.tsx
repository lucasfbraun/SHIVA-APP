import { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { clienteService, ClienteData } from '@/services/clienteService';
import { sinucaService } from '@/services/sinucaService';
import {
  SinucaPartida,
  SinucaTorneio,
  SinucaTorneioPartida,
  SinucaTipoPartida,
  SinucaTipoTorneio
} from '@/types';

const melhorDeOpcoes = [1, 3, 5, 7];

export default function Sinuca() {
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [partidas, setPartidas] = useState<SinucaPartida[]>([]);
  const [torneios, setTorneios] = useState<SinucaTorneio[]>([]);
  const [torneioDetalhe, setTorneioDetalhe] = useState<SinucaTorneio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const [partidaForm, setPartidaForm] = useState({
    clienteAId: '',
    clienteBId: '',
    tipo: 'UNICA' as SinucaTipoPartida,
    melhorDe: 1,
    observacao: ''
  });

  const [torneioForm, setTorneioForm] = useState({
    nome: '',
    tipo: 'TODOS_CONTRA_TODOS' as SinucaTipoTorneio,
    melhorDe: 3,
    participantes: [] as string[]
  });

  const [buscaJogadores, setBuscaJogadores] = useState('');
  const [buscaParticipantes, setBuscaParticipantes] = useState('');

  const [placaresPartidas, setPlacaresPartidas] = useState<
    Record<string, { a: number; b: number }>
  >({});
  const [placaresTorneio, setPlacaresTorneio] = useState<
    Record<string, { a: number; b: number }>
  >({});

  useEffect(() => {
    carregarBase();
  }, []);

  useEffect(() => {
    const next: Record<string, { a: number; b: number }> = {};
    partidas.forEach((partida) => {
      next[partida.id] = { a: partida.vitoriasA, b: partida.vitoriasB };
    });
    setPlacaresPartidas(next);
  }, [partidas]);

  useEffect(() => {
    if (!torneioDetalhe?.partidas) {
      setPlacaresTorneio({});
      return;
    }
    const next: Record<string, { a: number; b: number }> = {};
    torneioDetalhe.partidas.forEach((partida) => {
      next[partida.id] = { a: partida.vitoriasA, b: partida.vitoriasB };
    });
    setPlacaresTorneio(next);
  }, [torneioDetalhe]);

  const carregarBase = async () => {
    try {
      setCarregando(true);
      const [clientesData, partidasData, torneiosData] = await Promise.all([
        clienteService.getAll(),
        sinucaService.getPartidas(),
        sinucaService.getTorneios()
      ]);
      setClientes(clientesData);
      setPartidas(partidasData);
      setTorneios(torneiosData);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao carregar modulo de sinuca');
    } finally {
      setCarregando(false);
    }
  };

  const carregarTorneioDetalhe = async (torneioId: string) => {
    try {
      setCarregandoDetalhe(true);
      const data = await sinucaService.getTorneioById(torneioId);
      setTorneioDetalhe(data);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao carregar torneio');
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const handleCriarPartida = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partidaForm.clienteAId || !partidaForm.clienteBId) {
      alert('Selecione os dois jogadores');
      return;
    }
    if (partidaForm.clienteAId === partidaForm.clienteBId) {
      alert('Os jogadores precisam ser diferentes');
      return;
    }

    try {
      const melhorDe = partidaForm.tipo === 'UNICA' ? 1 : partidaForm.melhorDe;
      await sinucaService.createPartida({
        clienteAId: partidaForm.clienteAId,
        clienteBId: partidaForm.clienteBId,
        tipo: partidaForm.tipo,
        melhorDe,
        observacao: partidaForm.observacao.trim() || undefined
      });
      setPartidaForm({
        clienteAId: '',
        clienteBId: '',
        tipo: 'UNICA',
        melhorDe: 1,
        observacao: ''
      });
      await carregarBase();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar partida');
    }
  };

  const handleAtualizarPartida = async (partidaId: string) => {
    const placar = placaresPartidas[partidaId];
    if (!placar) {
      return;
    }

    try {
      await sinucaService.updatePartida(partidaId, {
        vitoriasA: placar.a,
        vitoriasB: placar.b
      });
      await carregarBase();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar partida');
    }
  };

  const handleCriarTorneio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!torneioForm.nome.trim()) {
      alert('Informe o nome do torneio');
      return;
    }
    if (torneioForm.participantes.length < 2) {
      alert('Selecione ao menos 2 participantes');
      return;
    }
    if (torneioForm.tipo === 'CHAVEAMENTO' && torneioForm.participantes.length % 2 !== 0) {
      alert('Chaveamento exige numero par de participantes');
      return;
    }

    try {
      await sinucaService.createTorneio({
        nome: torneioForm.nome.trim(),
        tipo: torneioForm.tipo,
        melhorDe: torneioForm.melhorDe,
        participantes: torneioForm.participantes
      });
      setTorneioForm({
        nome: '',
        tipo: 'TODOS_CONTRA_TODOS',
        melhorDe: 3,
        participantes: []
      });
      await carregarBase();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar torneio');
    }
  };

  const handleAtualizarPartidaTorneio = async (partidaId: string) => {
    if (!torneioDetalhe) {
      return;
    }
    const placar = placaresTorneio[partidaId];
    if (!placar) {
      return;
    }

    try {
      const atualizado = await sinucaService.updateTorneioPartida(
        torneioDetalhe.id,
        partidaId,
        {
          vitoriasA: placar.a,
          vitoriasB: placar.b
        }
      );
      setTorneioDetalhe((prev) => {
        if (!prev || !prev.partidas) {
          return prev;
        }
        const partidasAtualizadas = prev.partidas.map((item) =>
          item.id === atualizado.id ? { ...item, ...atualizado } : item
        );
        return { ...prev, partidas: partidasAtualizadas };
      });
      await carregarBase();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar partida do torneio');
    }
  };

  const toggleParticipante = (clienteId: string) => {
    setTorneioForm((prev) => {
      const existe = prev.participantes.includes(clienteId);
      return {
        ...prev,
        participantes: existe
          ? prev.participantes.filter((id) => id !== clienteId)
          : [...prev.participantes, clienteId]
      };
    });
  };

  const clientesOrdenados = useMemo(() => {
    return [...clientes].sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
  }, [clientes]);

  const clientesFiltradosPartida = useMemo(() => {
    const termo = buscaJogadores.trim().toLowerCase();
    if (!termo) {
      return clientesOrdenados;
    }
    return clientesOrdenados.filter((cliente) => {
      const nome = cliente.nomeCompleto.toLowerCase();
      const telefone = cliente.telefone?.toLowerCase() || '';
      const cpf = cliente.cpf?.toLowerCase() || '';
      return nome.includes(termo) || telefone.includes(termo) || cpf.includes(termo);
    });
  }, [buscaJogadores, clientesOrdenados]);

  const clientesFiltradosTorneio = useMemo(() => {
    const termo = buscaParticipantes.trim().toLowerCase();
    if (!termo) {
      return clientesOrdenados;
    }
    return clientesOrdenados.filter((cliente) => {
      const nome = cliente.nomeCompleto.toLowerCase();
      const telefone = cliente.telefone?.toLowerCase() || '';
      const cpf = cliente.cpf?.toLowerCase() || '';
      return nome.includes(termo) || telefone.includes(termo) || cpf.includes(termo);
    });
  }, [buscaParticipantes, clientesOrdenados]);

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="title">Sinuca</h1>
          <p className="text-text-secondary mt-2">
            Gerencie partidas rapidas e torneios entre clientes
          </p>
        </div>
        <div className="flex items-center gap-2 text-purple-highlight">
          <Trophy size={24} />
          <span className="font-semibold">Modulo Sinuca</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Nova Partida</h2>
          <form onSubmit={handleCriarPartida} className="space-y-4">
            <div>
              <label className="label">Buscar cliente</label>
              <input
                type="text"
                className="input"
                placeholder="Nome, telefone ou CPF"
                value={buscaJogadores}
                onChange={(e) => setBuscaJogadores(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Jogador A</label>
                <select
                  className="input"
                  value={partidaForm.clienteAId}
                  onChange={(e) => setPartidaForm({ ...partidaForm, clienteAId: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {clientesFiltradosPartida.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nomeCompleto}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Jogador B</label>
                <select
                  className="input"
                  value={partidaForm.clienteBId}
                  onChange={(e) => setPartidaForm({ ...partidaForm, clienteBId: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {clientesFiltradosPartida.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nomeCompleto}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Tipo de Partida</label>
                <select
                  className="input"
                  value={partidaForm.tipo}
                  onChange={(e) =>
                    setPartidaForm({
                      ...partidaForm,
                      tipo: e.target.value as SinucaTipoPartida,
                      melhorDe: e.target.value === 'UNICA' ? 1 : 3
                    })
                  }
                >
                  <option value="UNICA">Unica</option>
                  <option value="MELHOR_DE">Melhor de N</option>
                </select>
              </div>
              <div>
                <label className="label">Melhor de</label>
                <select
                  className="input"
                  value={partidaForm.melhorDe}
                  onChange={(e) =>
                    setPartidaForm({ ...partidaForm, melhorDe: Number(e.target.value) })
                  }
                  disabled={partidaForm.tipo === 'UNICA'}
                >
                  {melhorDeOpcoes
                    .filter((valor) => (partidaForm.tipo === 'UNICA' ? valor === 1 : valor > 1))
                    .map((valor) => (
                      <option key={valor} value={valor}>
                        {valor}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Observacao</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: mesa 2, valendo rodada"
                value={partidaForm.observacao}
                onChange={(e) => setPartidaForm({ ...partidaForm, observacao: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Criar Partida
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Novo Torneio</h2>
          <form onSubmit={handleCriarTorneio} className="space-y-4">
            <div>
              <label className="label">Nome do torneio</label>
              <input
                type="text"
                className="input"
                placeholder="Ex: Desafio do Sabado"
                value={torneioForm.nome}
                onChange={(e) => setTorneioForm({ ...torneioForm, nome: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Modelo</label>
                <select
                  className="input"
                  value={torneioForm.tipo}
                  onChange={(e) =>
                    setTorneioForm({ ...torneioForm, tipo: e.target.value as SinucaTipoTorneio })
                  }
                >
                  <option value="TODOS_CONTRA_TODOS">Todos contra todos</option>
                  <option value="CHAVEAMENTO">Chaveamento</option>
                </select>
              </div>
              <div>
                <label className="label">Melhor de</label>
                <select
                  className="input"
                  value={torneioForm.melhorDe}
                  onChange={(e) =>
                    setTorneioForm({ ...torneioForm, melhorDe: Number(e.target.value) })
                  }
                >
                  {melhorDeOpcoes
                    .filter((valor) => valor > 1)
                    .map((valor) => (
                      <option key={valor} value={valor}>
                        {valor}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Participantes</label>
              <input
                type="text"
                className="input mb-3"
                placeholder="Buscar clientes"
                value={buscaParticipantes}
                onChange={(e) => setBuscaParticipantes(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-purple-primary/20 rounded-lg p-3">
                {clientesFiltradosTorneio.map((cliente) => (
                  <label key={cliente.id} className="flex items-center gap-2 text-text-secondary">
                    <input
                      type="checkbox"
                      className="accent-purple-primary"
                      checked={torneioForm.participantes.includes(cliente.id || '')}
                      onChange={() => toggleParticipante(cliente.id || '')}
                    />
                    <span>{cliente.nomeCompleto}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {torneioForm.tipo === 'CHAVEAMENTO'
                  ? 'Chaveamento exige numero par de participantes.'
                  : 'Todos contra todos gera partidas entre todas as duplas.'}
              </p>
            </div>

            <div className="flex justify-end">
              <button type="submit" className="btn-primary">
                Criar Torneio
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Partidas Recentes</h2>
          {partidas.length === 0 ? (
            <p className="text-text-secondary">Nenhuma partida criada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-primary/30">
                    <th className="px-3 py-2 text-left text-text-secondary">Jogadores</th>
                    <th className="px-3 py-2 text-left text-text-secondary">Tipo</th>
                    <th className="px-3 py-2 text-center text-text-secondary">Placar</th>
                    <th className="px-3 py-2 text-left text-text-secondary">Status</th>
                    <th className="px-3 py-2 text-right text-text-secondary">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {partidas.map((partida) => (
                    <tr key={partida.id} className="border-b border-purple-primary/10">
                      <td className="px-3 py-2 text-text-primary">
                        {partida.clienteA?.nomeCompleto || 'Jogador A'}
                        <span className="text-text-secondary"> x </span>
                        {partida.clienteB?.nomeCompleto || 'Jogador B'}
                      </td>
                      <td className="px-3 py-2 text-text-secondary">
                        {partida.tipo === 'UNICA' ? 'Unica' : `Melhor de ${partida.melhorDe}`}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={partida.melhorDe}
                            className="w-14 input text-center"
                            value={placaresPartidas[partida.id]?.a ?? partida.vitoriasA}
                            onChange={(e) =>
                              setPlacaresPartidas((prev) => ({
                                ...prev,
                                [partida.id]: {
                                  a: Number(e.target.value),
                                  b: prev[partida.id]?.b ?? partida.vitoriasB
                                }
                              }))
                            }
                            disabled={partida.status === 'FINALIZADA'}
                          />
                          <span className="text-text-secondary">x</span>
                          <input
                            type="number"
                            min={0}
                            max={partida.melhorDe}
                            className="w-14 input text-center"
                            value={placaresPartidas[partida.id]?.b ?? partida.vitoriasB}
                            onChange={(e) =>
                              setPlacaresPartidas((prev) => ({
                                ...prev,
                                [partida.id]: {
                                  a: prev[partida.id]?.a ?? partida.vitoriasA,
                                  b: Number(e.target.value)
                                }
                              }))
                            }
                            disabled={partida.status === 'FINALIZADA'}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-text-secondary">{partida.status}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="btn-secondary"
                          onClick={() => handleAtualizarPartida(partida.id)}
                          disabled={partida.status === 'FINALIZADA'}
                        >
                          Salvar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Torneios</h2>
          {torneios.length === 0 ? (
            <p className="text-text-secondary">Nenhum torneio criado ainda.</p>
          ) : (
            <div className="space-y-3">
              {torneios.map((torneio) => (
                <button
                  key={torneio.id}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    torneioDetalhe?.id === torneio.id
                      ? 'border-purple-primary bg-background-primary/70'
                      : 'border-purple-primary/20 hover:bg-background-primary/50'
                  }`}
                  onClick={() => carregarTorneioDetalhe(torneio.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-text-primary">{torneio.nome}</p>
                      <p className="text-sm text-text-secondary">
                        {torneio.tipo === 'CHAVEAMENTO'
                          ? 'Chaveamento'
                          : 'Todos contra todos'}
                        {' • Melhor de '}
                        {torneio.melhorDe}
                      </p>
                    </div>
                    <div className="text-right text-sm text-text-secondary">
                      <p>Status: {torneio.status}</p>
                      <p>
                        {torneio._count?.participantes || 0} participantes •{' '}
                        {torneio._count?.partidas || 0} partidas
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {torneioDetalhe && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">{torneioDetalhe.nome}</h2>
              <p className="text-text-secondary text-sm">
                {torneioDetalhe.tipo === 'CHAVEAMENTO'
                  ? 'Chaveamento'
                  : 'Todos contra todos'}
                {' • Melhor de '}
                {torneioDetalhe.melhorDe}
              </p>
            </div>
            {carregandoDetalhe && (
              <span className="text-text-secondary text-sm">Carregando detalhes...</span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Participantes</h3>
              <div className="space-y-2">
                {torneioDetalhe.participantes?.map((participante) => (
                  <div
                    key={participante.id}
                    className="flex items-center justify-between bg-background-primary/60 px-3 py-2 rounded-lg"
                  >
                    <span className="text-text-primary">
                      {participante.cliente?.nomeCompleto || 'Cliente'}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {participante.pontos} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-text-secondary mb-2">Partidas</h3>
              {torneioDetalhe.partidas && torneioDetalhe.partidas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-purple-primary/30">
                        <th className="px-3 py-2 text-left text-text-secondary">Rodada</th>
                        <th className="px-3 py-2 text-left text-text-secondary">Jogadores</th>
                        <th className="px-3 py-2 text-center text-text-secondary">Placar</th>
                        <th className="px-3 py-2 text-left text-text-secondary">Status</th>
                        <th className="px-3 py-2 text-right text-text-secondary">Acoes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {torneioDetalhe.partidas.map((partida: SinucaTorneioPartida) => (
                        <tr key={partida.id} className="border-b border-purple-primary/10">
                          <td className="px-3 py-2 text-text-secondary">{partida.rodada}</td>
                          <td className="px-3 py-2 text-text-primary">
                            {partida.clienteA?.nomeCompleto || 'Jogador A'}
                            <span className="text-text-secondary"> x </span>
                            {partida.clienteB?.nomeCompleto || 'Jogador B'}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={partida.melhorDe}
                                className="w-14 input text-center"
                                value={placaresTorneio[partida.id]?.a ?? partida.vitoriasA}
                                onChange={(e) =>
                                  setPlacaresTorneio((prev) => ({
                                    ...prev,
                                    [partida.id]: {
                                      a: Number(e.target.value),
                                      b: prev[partida.id]?.b ?? partida.vitoriasB
                                    }
                                  }))
                                }
                                disabled={partida.status === 'FINALIZADA'}
                              />
                              <span className="text-text-secondary">x</span>
                              <input
                                type="number"
                                min={0}
                                max={partida.melhorDe}
                                className="w-14 input text-center"
                                value={placaresTorneio[partida.id]?.b ?? partida.vitoriasB}
                                onChange={(e) =>
                                  setPlacaresTorneio((prev) => ({
                                    ...prev,
                                    [partida.id]: {
                                      a: prev[partida.id]?.a ?? partida.vitoriasA,
                                      b: Number(e.target.value)
                                    }
                                  }))
                                }
                                disabled={partida.status === 'FINALIZADA'}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-2 text-text-secondary">{partida.status}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              className="btn-secondary"
                              onClick={() => handleAtualizarPartidaTorneio(partida.id)}
                              disabled={partida.status === 'FINALIZADA'}
                            >
                              Salvar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary">Nenhuma partida gerada.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
