import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Calendar, FileText, Filter, Package, Search, X } from 'lucide-react';
import { estoqueService, EntradaEstoque } from '@/services/estoqueService';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RelatorioEstoque() {
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'MANUAL' | 'OCR'>('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProdutos();
  }, []);

  useEffect(() => {
    loadEntradas();
  }, [filtroTipo, dataInicio, dataFim, produtoId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProdutos = async () => {
    try {
      const data = await produtoService.getAll();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadEntradas = async () => {
    try {
      setLoading(true);
      const filtros: any = {};
      
      if (filtroTipo !== 'TODOS') {
        filtros.tipoEntrada = filtroTipo;
      }
      
      if (dataInicio) {
        filtros.dataInicio = dataInicio;
      }
      
      if (dataFim) {
        filtros.dataFim = dataFim;
      }
      
      if (produtoId) {
        filtros.produtoId = produtoId;
      }
      
      const data = await estoqueService.getEntradas(filtros);
      setEntradas(data);
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
    } finally {
      setLoading(false);
    }
  };

  const entradasManuais = entradas.filter(e => e.tipoEntrada === 'MANUAL');
  const entradasOCR = entradas.filter(e => e.tipoEntrada === 'OCR');
  
  const totalQuantidade = entradas.reduce((acc, e) => acc + e.quantidade, 0);
  const totalValor = entradas.reduce((acc, e) => acc + (e.quantidade * e.custoUnitario), 0);

  const limparFiltros = () => {
    setFiltroTipo('TODOS');
    setDataInicio('');
    setDataFim('');
    setProdutoId('');
    setBuscaProduto('');
    setProdutoSelecionado(null);
  };

  const produtosFiltrados = produtos.filter(p => 
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
  ).slice(0, 10);

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setProdutoId(produto.id);
    setBuscaProduto('');
    setMostrarSugestoes(false);
  };

  const handleRemoverProduto = () => {
    setProdutoSelecionado(null);
    setProdutoId('');
    setBuscaProduto('');
  };

  return (
    <div className="container-main px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-title text-3xl md:text-4xl font-bold text-text-primary mb-2">
          Relatório de Movimentos de Estoque
        </h1>
        <p className="text-text-secondary">
          Histórico completo de entradas de estoque
        </p>
      </div>

      {/* Filtros */}
      <div className="card-primary mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-purple-primary" />
          <h2 className="font-semibold text-text-primary">Filtros</h2>
        </div>

        <div className="space-y-16">
          {/* Primeira linha - Busca de Produto */}
          <div ref={searchRef} className="pb-8">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Produto
            </label>
            {produtoSelecionado ? (
              <div className="flex items-center gap-2 bg-purple-primary/10 border border-purple-primary/30 rounded-lg px-3 py-2">
                <Package size={16} className="text-purple-primary" />
                <span className="flex-1 text-sm text-text-primary">{produtoSelecionado.nome}</span>
                <button
                  onClick={handleRemoverProduto}
                  className="text-text-secondary hover:text-red-500 transition"
                  title="Remover filtro"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={buscaProduto}
                  onChange={(e) => {
                    setBuscaProduto(e.target.value);
                    setMostrarSugestoes(true);
                  }}
                  onFocus={() => setMostrarSugestoes(true)}
                  className="input-primary pl-9 text-sm"
                />
                {mostrarSugestoes && buscaProduto && produtosFiltrados.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-surface-secondary border border-purple-primary/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {produtosFiltrados.map(produto => (
                      <button
                        key={produto.id}
                        onClick={() => handleSelecionarProduto(produto)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-primary/10 transition flex items-center gap-2 border-b border-purple-primary/10 last:border-b-0"
                      >
                        <Package size={14} className="text-purple-primary" />
                        <div>
                          <div className="text-sm text-text-primary font-medium">{produto.nome}</div>
                          {produto.categoria && (
                            <div className="text-xs text-text-secondary">{produto.categoria}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {mostrarSugestoes && buscaProduto && produtosFiltrados.length === 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-surface-secondary border border-purple-primary/30 rounded-lg shadow-xl p-3">
                    <p className="text-sm text-text-secondary">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Segunda linha - Outros filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tipo de Entrada */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Tipo de Entrada
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value as any)}
                className="input-primary"
              >
                <option value="TODOS">Todos</option>
                <option value="MANUAL">Movimento Manual</option>
                <option value="OCR">OCR Cupom</option>
              </select>
            </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="input-primary"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="input-primary"
            />
          </div>

          {/* Botão Limpar */}
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="btn-secondary w-full"
            >
              Limpar Filtros
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total de Entradas</p>
              <p className="text-2xl font-bold text-text-primary">{entradas.length}</p>
            </div>
            <TrendingUp className="text-purple-primary" size={32} />
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Movimento Manual</p>
              <p className="text-2xl font-bold text-blue-action">{entradasManuais.length}</p>
            </div>
            <Package className="text-blue-action" size={32} />
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Via OCR Cupom</p>
              <p className="text-2xl font-bold text-green-action">{entradasOCR.length}</p>
            </div>
            <FileText className="text-green-action" size={32} />
          </div>
        </div>

        <div className="card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Valor Total</p>
              <p className="text-2xl font-bold text-purple-primary">R$ {totalValor.toFixed(2)}</p>
            </div>
            <TrendingUp className="text-purple-primary" size={32} />
          </div>
        </div>
      </div>

      {/* Tabela de Entradas */}
      <div className="card-primary">
        <h2 className="font-semibold text-text-primary mb-4">
          Histórico de Entradas ({entradas.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-text-secondary">Carregando...</div>
        ) : entradas.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Nenhuma entrada encontrada
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-primary/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Qtd</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Custo Unit.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Nº Cupom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Observação</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((entrada) => (
                  <tr key={entrada.id} className="border-b border-purple-primary/10 hover:bg-purple-primary/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-secondary" />
                        <span className="text-sm text-text-primary">
                          {format(new Date(entrada.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{entrada.produto.nome}</div>
                        {entrada.produto.codigoInterno && (
                          <div className="text-xs text-text-secondary">Cód: {entrada.produto.codigoInterno}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-text-primary">{entrada.quantidade}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-text-primary">R$ {entrada.custoUnitario.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-text-primary">
                        R$ {(entrada.quantidade * entrada.custoUnitario).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {entrada.tipoEntrada === 'MANUAL' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-action/10 text-blue-action">
                          <Package size={12} className="mr-1" />
                          Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-action/10 text-green-action">
                          <FileText size={12} className="mr-1" />
                          OCR
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-text-secondary">
                        {entrada.numeroCupom || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-text-secondary truncate max-w-xs block">
                        {entrada.observacao || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
