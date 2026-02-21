import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, Package } from 'lucide-react';
import { comandaService } from '@/services/comandaService';
import { produtoService } from '@/services/produtoService';
import { Comanda, Produto } from '@/types';
import { format } from 'date-fns';

export default function ComandaDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comanda, setComanda] = useState<Comanda | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [adicionando, setAdicionando] = useState(false);

  useEffect(() => {
    loadComanda();
    loadProdutos();
  }, [id]);

  const loadComanda = async () => {
    try {
      setLoading(true);
      const data = await comandaService.getById(id!);
      setComanda(data);
    } catch (error) {
      console.error('Erro ao carregar comanda:', error);
      navigate('/comandas');
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const data = await produtoService.getAll({ ativo: true });
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const handleAdicionarItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!produtoSelecionado || !quantidade) {
      alert('Selecione um produto e quantidade');
      return;
    }

    try {
      setAdicionando(true);
      await comandaService.adicionarItem(id!, produtoSelecionado, parseFloat(quantidade));
      setProdutoSelecionado('');
      setQuantidade('1');
      setModalOpen(false);
      loadComanda();
    } catch (error: any) {
      console.error('Erro ao adicionar item:', error);
      alert(error.response?.data?.error || 'Erro ao adicionar item');
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemoverItem = async (itemId: string) => {
    if (!confirm('Deseja remover este item?')) return;

    try {
      await comandaService.removerItem(id!, itemId);
      loadComanda();
    } catch (error: any) {
      console.error('Erro ao remover item:', error);
      alert(error.response?.data?.error || 'Erro ao remover item');
    }
  };

  const handleFecharComanda = async () => {
    if (!confirm('Deseja fechar esta comanda? O estoque será baixado.')) return;

    try {
      await comandaService.fechar(id!);
      navigate('/comandas');
    } catch (error: any) {
      console.error('Erro ao fechar comanda:', error);
      alert(error.response?.data?.error || 'Erro ao fechar comanda');
    }
  };

  const handleCancelarComanda = async () => {
    if (!confirm('Deseja cancelar esta comanda?')) return;

    try {
      await comandaService.cancelar(id!);
      navigate('/comandas');
    } catch (error: any) {
      console.error('Erro ao cancelar comanda:', error);
      alert(error.response?.data?.error || 'Erro ao cancelar comanda');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  if (!comanda) {
    return <div className="card text-center">Comanda não encontrada</div>;
  }

  const isAberta = comanda.status === 'ABERTA';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/comandas')}
          className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
        >
          <ArrowLeft className="text-text-primary" size={24} />
        </button>
        <div className="flex-1">
          <div className="flex items-baseline gap-3">
            <h1 className="title">Comanda #{comanda.numeroComanda.toString().padStart(3, '0')}</h1>
            <span className="text-text-secondary">•</span>
            <span className="text-lg text-text-primary font-semibold">{comanda.nomeCliente}</span>
          </div>
          <p className="text-text-secondary mt-2">
            Aberta em {format(new Date(comanda.dataAbertura), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
          comanda.status === 'ABERTA' ? 'bg-purple-primary/20 text-purple-highlight' :
          comanda.status === 'FECHADA' ? 'bg-green-500/20 text-green-400' :
          'bg-red-400/20 text-red-400'
        }`}>
          {comanda.status}
        </span>
      </div>

      {/* Resumo */}
      <div className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-text-secondary text-sm">Itens</p>
            <p className="text-2xl font-bold text-text-primary mt-1">
              {comanda.itens?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Total</p>
            <p className="text-2xl font-bold text-purple-highlight mt-1">
              R$ {comanda.total.toFixed(2)}
            </p>
          </div>
          <div className="col-span-2">
            {isAberta && (
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Plus size={20} />
                <span>Adicionar Item</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Itens da Comanda</h2>
        
        {comanda.itens && comanda.itens.length > 0 ? (
          <div className="space-y-3">
            {comanda.itens.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 bg-background-primary rounded-lg"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-background-secondary flex items-center justify-center">
                    {item.produto?.imagemUrl ? (
                      <img
                        src={item.produto.imagemUrl}
                        alt={item.nomeProduto}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Package className="text-text-secondary" size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{item.nomeProduto}</p>
                    <p className="text-sm text-text-secondary">
                      {item.quantidade} x R$ {item.precoUnitario.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-semibold text-purple-highlight">
                    R$ {item.subtotal.toFixed(2)}
                  </p>
                  {isAberta && (
                    <button
                      onClick={() => handleRemoverItem(item.id)}
                      className="p-2 rounded-lg hover:bg-red-action/10 transition-colors"
                    >
                      <Trash2 className="text-red-400" size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">Nenhum item adicionado</p>
        )}
      </div>

      {/* Ações */}
      {isAberta && (
        <div className="flex gap-4">
          <button
            onClick={handleCancelarComanda}
            className="btn-secondary flex-1 flex items-center justify-center space-x-2 hover:bg-red-action/10 hover:border-red-action"
          >
            <XCircle size={20} />
            <span>Cancelar</span>
          </button>
          <button
            onClick={handleFecharComanda}
            disabled={!comanda.itens || comanda.itens.length === 0}
            className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={20} />
            <span>Fechar Comanda</span>
          </button>
        </div>
      )}

      {/* Modal Adicionar Item */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-purple-primary/30 rounded-2xl p-6 max-w-md w-full shadow-glow-purple max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Adicionar Item</h2>
            
            <form onSubmit={handleAdicionarItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Produto *
                </label>
                <select
                  value={produtoSelecionado}
                  onChange={(e) => setProdutoSelecionado(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} - R$ {produto.precoVenda.toFixed(2)} (Estoque: {produto.estoque?.quantidade || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setProdutoSelecionado('');
                    setQuantidade('1');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adicionando}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {adicionando ? 'Adicionando...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
