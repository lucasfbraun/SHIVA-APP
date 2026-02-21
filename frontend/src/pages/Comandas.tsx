import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { comandaService } from '@/services/comandaService';
import { clienteService, ClienteData } from '@/services/clienteService';
import { Comanda } from '@/types';
import { format } from 'date-fns';

export default function Comandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [comandasFiltradas, setComandasFiltradas] = useState<Comanda[]>([]);
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [clientesFiltrados, setClientesFiltrados] = useState<ClienteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('ABERTA');
  const [pesquisa, setPesquisa] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<'cadastrado' | 'informal'>('informal');
  const [clienteId, setClienteId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [observacao, setObservacao] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    loadComandas();
    loadClientes();
  }, [filtroStatus, mes, ano]);

  useEffect(() => {
    filtrarComandas();
  }, [comandas, pesquisa]);

  const loadClientes = async () => {
    try {
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadComandas = async () => {
    try {
      setLoading(true);
      const data = await comandaService.getAll(filtroStatus);
      
      // Filtrar por mês e ano
      const inicioMes = new Date(ano, mes - 1, 1);
      const fimMes = new Date(ano, mes, 0, 23, 59, 59, 999);
      
      const filtradas = data.filter((comanda: Comanda) => {
        const dataComanda = new Date(comanda.dataAbertura);
        return dataComanda >= inicioMes && dataComanda <= fimMes;
      });
      
      setComandas(filtradas);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarComandas = () => {
    if (!pesquisa.trim()) {
      setComandasFiltradas(comandas);
      return;
    }

    const termo = pesquisa.toLowerCase();
    const filtradas = comandas.filter((comanda) => {
      return (
        comanda.nomeCliente.toLowerCase().includes(termo) ||
        comanda.id.toString().includes(termo)
      );
    });
    setComandasFiltradas(filtradas);
  };

  const getMesNome = (m: number) => {
    return new Date(2024, m - 1).toLocaleString('pt-BR', { month: 'long' });
  };

  useEffect(() => {
    const termo = buscaCliente.toLowerCase();
    const filtered = clientes.filter(
      (cliente) =>
        cliente.nomeCompleto.toLowerCase().includes(termo) ||
        cliente.telefone.toLowerCase().includes(termo) ||
        cliente.cpf.toLowerCase().includes(termo)
    );
    setClientesFiltrados(filtered);
  }, [buscaCliente, clientes]);

  const handleCriarComanda = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let clienteName = nomeCliente.trim();
    
    if (tipoCliente === 'cadastrado') {
      if (!clienteId) {
        alert('Selecione um cliente');
        return;
      }
      const cliente = clientes.find(c => c.id === clienteId);
      clienteName = cliente?.nomeCompleto || '';
    } else {
      if (!clienteName) {
        alert('Nome do cliente é obrigatório');
        return;
      }
    }

    try {
      setCriando(true);
      await comandaService.create(clienteName, observacao, tipoCliente === 'cadastrado' ? clienteId : undefined);
      setNomeCliente('');
      setObservacao('');
      setClienteId('');
      setBuscaCliente('');
      setTipoCliente('informal');
      setModalOpen(false);
      loadComandas();
    } catch (error: any) {
      console.error('Erro ao criar comanda:', error);
      alert(error.response?.data?.error || 'Erro ao criar comanda');
    } finally {
      setCriando(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return <Clock className="text-purple-highlight" size={20} />;
      case 'FECHADA':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'CANCELADA':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return <FileText className="text-text-secondary" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ABERTA':
        return 'bg-purple-primary/20 text-purple-highlight';
      case 'FECHADA':
        return 'bg-green-500/20 text-green-400';
      case 'CANCELADA':
        return 'bg-red-400/20 text-red-400';
      default:
        return 'bg-text-secondary/20 text-text-secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="title">Comandas</h1>
          <p className="text-text-secondary mt-2">Gerencie os atendimentos</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="btn-primary flex items-center space-x-2 justify-center"
        >
          <Plus size={20} />
          <span>Nova Comanda</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="card space-y-4">
        {/* Status */}
        <div className="flex gap-3 overflow-x-auto">
          {['ABERTA', 'FECHADA', 'CANCELADA', ''].map((status) => (
            <button
              key={status || 'todas'}
              onClick={() => setFiltroStatus(status)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                filtroStatus === status
                  ? 'bg-purple-primary text-white shadow-glow-purple-sm'
                  : 'bg-background-primary text-text-secondary hover:text-text-primary'
              }`}
            >
              {status || 'Todas'}
            </button>
          ))}
        </div>

        {/* Pesquisa e Filtros de Data */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Pesquisar por cliente ou número..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="input w-full pl-10"
            />
          </div>
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="input py-2 px-3 text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{getMesNome(m)}</option>
            ))}
          </select>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="input py-2 px-3 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Comandas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
        </div>
      ) : comandasFiltradas.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="mx-auto text-text-secondary mb-4" size={48} />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Nenhuma comanda encontrada
          </h3>
          <p className="text-text-secondary mb-6">Abra uma nova comanda para começar</p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Comanda</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comandasFiltradas.map((comanda) => (
            <Link
              key={comanda.id}
              to={`/comandas/${comanda.id}`}
              className="card hover:scale-105 transition-transform cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(comanda.status)}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(comanda.status)}`}>
                    {comanda.status}
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  {format(new Date(comanda.dataAbertura), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>

              {/* Cliente */}
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {comanda.nomeCliente}
              </h3>

              {/* Info */}
              <div className="space-y-2 pt-3 border-t border-purple-primary/20">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Itens:</span>
                  <span className="text-text-primary font-medium">
                    {comanda.itens?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total:</span>
                  <span className="text-purple-highlight font-semibold text-lg">
                    R$ {comanda.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal Nova Comanda */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-purple-primary/30 rounded-2xl p-6 max-w-md w-full shadow-glow-purple">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Nova Comanda</h2>
            
            <form onSubmit={handleCriarComanda} className="space-y-4">
              {/* Tipo de Cliente */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                  Tipo de Cliente
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTipoCliente('informal');
                      setClienteId('');
                      setNomeCliente('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      tipoCliente === 'informal'
                        ? 'bg-purple-primary text-white'
                        : 'bg-background-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Informal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoCliente('cadastrado');
                      setNomeCliente('');
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      tipoCliente === 'cadastrado'
                        ? 'bg-purple-primary text-white'
                        : 'bg-background-primary text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Cadastrado
                  </button>
                </div>
              </div>

              {/* Campo de Cliente */}
              {tipoCliente === 'informal' ? (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="input w-full"
                    placeholder="Digite o nome"
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Selecione um Cliente *
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 text-text-secondary" size={18} />
                      <input
                        type="text"
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                        placeholder="Buscar por nome, telefone ou CPF..."
                        className="input w-full pl-10"
                        autoFocus
                      />
                    </div>
                    
                    {buscaCliente && clientesFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-purple-primary/30 rounded-lg shadow-glow-purple z-50 max-h-64 overflow-y-auto">
                        {clientesFiltrados.map((cliente) => (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => {
                              setClienteId(cliente.id || '');
                              setBuscaCliente('');
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-purple-primary/20 transition-colors border-b border-purple-primary/10 last:border-0"
                          >
                            <div className="font-medium text-text-primary">{cliente.nomeCompleto}</div>
                            <div className="text-xs text-text-secondary">
                              {cliente.telefone} • {cliente.cpf}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {buscaCliente && clientesFiltrados.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-background-secondary border border-purple-primary/30 rounded-lg p-4 text-center text-text-secondary text-sm">
                        Nenhum cliente encontrado com "{buscaCliente}"
                      </div>
                    )}
                  </div>
                  
                  {clienteId && clientes.find((c) => c.id === clienteId) && (
                    <div className="mt-2 p-3 bg-purple-primary/10 border border-purple-primary/30 rounded-lg">
                      <div className="font-medium text-text-primary">
                        {clientes.find((c) => c.id === clienteId)?.nomeCompleto}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {clientes.find((c) => c.id === clienteId)?.telefone}
                      </div>
                    </div>
                  )}
                  
                  {clientes.length === 0 && (
                    <p className="text-sm text-text-secondary mt-2">
                      Nenhum cliente cadastrado. Use "Informal" ou cadastre um cliente.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Observação
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="input w-full min-h-[80px]"
                  placeholder="Informações adicionais"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setNomeCliente('');
                    setObservacao('');
                    setClienteId('');
                    setBuscaCliente('');
                    setTipoCliente('informal');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criando}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {criando ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
