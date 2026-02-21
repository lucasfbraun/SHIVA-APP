import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { comandaService } from '@/services/comandaService';
import { clienteService, ClienteData } from '@/services/clienteService';
import { Comanda } from '@/types';
import { format } from 'date-fns';

export default function Comandas() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('ABERTA');
  const [modalOpen, setModalOpen] = useState(false);
  const [tipoCliente, setTipoCliente] = useState<'cadastrado' | 'informal'>('informal');
  const [clienteId, setClienteId] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [observacao, setObservacao] = useState('');
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    loadComandas();
    loadClientes();
  }, [filtroStatus]);

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
      setComandas(data);
    } catch (error) {
      console.error('Erro ao carregar comandas:', error);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Filtro */}
      <div className="card">
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
      </div>

      {/* Lista de Comandas */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
        </div>
      ) : comandas.length === 0 ? (
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
          {comandas.map((comanda) => (
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
                  <select
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="input w-full"
                    required
                    autoFocus
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id || ''}>
                        {cliente.nomeCompleto}
                      </option>
                    ))}
                  </select>
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
