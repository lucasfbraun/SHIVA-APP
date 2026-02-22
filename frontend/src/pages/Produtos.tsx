import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Package, PackagePlus, RefreshCw } from 'lucide-react';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';
import api from '@/services/api';

export default function Produtos() {
  // VERSÃO ATUALIZADA - SEM BOTÃO DE EDITAR ESTOQUE MANUAL - BUILD: 2026-02-22
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<boolean | undefined>(true);
  const [modalEntrada, setModalEntrada] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [processando, setProcessando] = useState(false);
  const [recalculando, setRecalculando] = useState(false);

  useEffect(() => {
    loadProdutos();
  }, [filtroAtivo]);

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const data = await produtoService.getAll({ ativo: filtroAtivo });
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar este produto?')) return;
    
    try {
      await produtoService.delete(id);
      loadProdutos();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      alert('Erro ao deletar produto');
    }
  };

  const abrirModalEntrada = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setCustoUnitario(produto.custoMedio.toString());
    setQuantidade('');
    setModalEntrada(true);
  };

  const handleEntradaEstoque = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!produtoSelecionado || !quantidade || !custoUnitario) {
      alert('Preencha quantidade e custo unitário');
      return;
    }

    try {
      setProcessando(true);
      
      await api.post('/estoque/entrada', {
        produtoId: produtoSelecionado.id,
        quantidade: parseFloat(quantidade),
        custoUnitario: parseFloat(custoUnitario),
      });

      setModalEntrada(false);
      setProdutoSelecionado(null);
      setQuantidade('');
      setCustoUnitario('');
      loadProdutos();
    } catch (error) {
      console.error('Erro ao dar entrada:', error);
      alert('Erro ao dar entrada no estoque');
    } finally {
      setProcessando(false);
    }
  };

  const handleRecalcularEstoque = async () => {
    if (!confirm('Deseja recalcular o estoque de todos os produtos?\n\nIsso irá recalcular baseado nas entradas e saídas registradas.')) {
      return;
    }

    try {
      setRecalculando(true);
      const response = await api.post('/estoque/recalcular');
      
      alert(`✅ Estoque recalculado com sucesso!\n\n${response.data.resultados.length} produto(s) atualizados.`);
      loadProdutos(); // Recarregar lista de produtos
    } catch (error) {
      console.error('Erro ao recalcular estoque:', error);
      alert('❌ Erro ao recalcular estoque');
    } finally {
      setRecalculando(false);
    }
  };

  const produtosFiltrados = produtos.filter((produto) => {
    return produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.categoria?.toLowerCase().includes(busca.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="title">Produtos</h1>
          <p className="text-text-secondary mt-2">Gerencie seu catálogo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRecalcularEstoque}
            disabled={recalculando}
            className="btn-secondary flex items-center space-x-2 justify-center"
            title="Recalcular estoque de todos os produtos baseado nos movimentos registrados"
          >
            <RefreshCw size={20} className={recalculando ? 'animate-spin' : ''} />
            <span>{recalculando ? 'Recalculando...' : 'Recalcular Estoque'}</span>
          </button>
          <Link to="/produtos/novo" className="btn-primary flex items-center space-x-2 justify-center">
            <Plus size={20} />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={filtroAtivo === undefined ? 'todos' : filtroAtivo ? 'true' : 'false'}
            onChange={(e) => {
              const value = e.target.value;
              setFiltroAtivo(value === 'todos' ? undefined : value === 'true');
            }}
            className="input"
          >
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
      </div>

      {/* Lista de Produtos */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="mx-auto text-text-secondary mb-4" size={48} />
          <h3 className="text-xl font-semibold text-text-primary mb-2">
            Nenhum produto encontrado
          </h3>
          <p className="text-text-secondary mb-6">
            Comece cadastrando seu primeiro produto
          </p>
          <Link to="/produtos/novo" className="btn-primary inline-flex items-center space-x-2">
            <Plus size={20} />
            <span>Cadastrar Produto</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtosFiltrados.map((produto) => (
            <div key={produto.id} className="card group">
              {/* Imagem */}
              <div className="aspect-square rounded-xl bg-background-primary mb-4 overflow-hidden">
                {produto.imagemUrl ? (
                  <img
                    src={produto.imagemUrl}
                    alt={produto.nome}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="text-text-secondary" size={48} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary">{produto.nome}</h3>
                    {produto.categoria && (
                      <p className="text-sm text-text-secondary">{produto.categoria}</p>
                    )}
                  </div>
                  {!produto.ativo && (
                    <span className="px-2 py-1 bg-red-action/20 text-red-400 text-xs rounded">
                      Inativo
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-primary/20">
                  <div>
                    <p className="text-xs text-text-secondary">Estoque</p>
                    <p className="font-medium text-text-primary">
                      {produto.controlaEstoque !== false ? (produto.estoque?.quantidade || 0) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-secondary">Preço</p>
                    <p className="font-semibold text-purple-highlight">
                      R$ {produto.precoVenda.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2">
                  {produto.controlaEstoque !== false && (
                    <button
                      onClick={() => abrirModalEntrada(produto)}
                      className="flex-1 btn-secondary py-2 text-sm flex items-center justify-center space-x-1 hover:bg-purple-primary/10"
                      title="Registrar entrada de estoque com nota/cupom"
                    >
                      <PackagePlus size={16} />
                      <span>Entrada</span>
                    </button>
                  )}
                  <Link
                    to={`/produtos/editar/${produto.id}`}
                    className="btn-secondary py-2 px-3 text-sm flex items-center justify-center"
                    title="Editar informações do produto"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(produto.id)}
                    className="btn-secondary py-2 px-3 text-sm hover:bg-red-action/10 hover:border-red-action"
                    title="Desativar produto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Entrada de Estoque */}
      {modalEntrada && produtoSelecionado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-purple-primary/30 rounded-2xl p-6 max-w-md w-full shadow-glow-purple">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Entrada de Estoque
            </h2>
            <p className="text-text-secondary mb-4">{produtoSelecionado.nome}</p>
            
            <form onSubmit={handleEntradaEstoque} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Quantidade *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="input w-full"
                  placeholder="Ex: 10"
                  autoFocus
                  required
                />
                <p className="text-xs text-text-secondary mt-1">Apenas valores inteiros</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Custo Unitário (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(e.target.value)}
                  className="input w-full"
                  placeholder="Ex: 3.50"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  Custo médio atual: R$ {produtoSelecionado.custoMedio.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalEntrada(false);
                    setProdutoSelecionado(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processando}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {processando ? 'Processando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
