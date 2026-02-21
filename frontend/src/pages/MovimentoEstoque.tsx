import { useState, useEffect } from 'react';
import { Package, TrendingUp, Search, Calendar, FileText } from 'lucide-react';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';

export default function MovimentoEstoque() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');
  const [dataEntrada, setDataEntrada] = useState('');
  const [numeroCupom, setNumeroCupom] = useState('');
  const [observacao, setObservacao] = useState('');
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    loadProdutos();
    // Definir data atual como padrão
    const hoje = new Date().toISOString().split('T')[0];
    setDataEntrada(hoje);
  }, []);

  const loadProdutos = async () => {
    try {
      const data = await produtoService.getAll({ ativo: true });
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigoInterno?.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigoBarras?.toLowerCase().includes(busca.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!produtoSelecionado) {
      alert('Selecione um produto');
      return;
    }

    const qtd = parseFloat(quantidade);
    const custo = parseFloat(custoUnitario);

    if (!qtd || qtd <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    if (!custo || custo < 0) {
      alert('Custo unitário deve ser informado');
      return;
    }

    try {
      setLoading(true);
      await produtoService.registrarEntradaEstoque({
        produtoId: produtoSelecionado.id,
        quantidade: qtd,
        custoUnitario: custo,
        dataEntrada,
        numeroCupom: numeroCupom || undefined,
        observacao: observacao || undefined
      });

      alert(`Entrada registrada com sucesso!\n\n${qtd} unidades de "${produtoSelecionado.nome}" adicionadas ao estoque.`);
      
      // Limpar form
      setProdutoSelecionado(null);
      setQuantidade('');
      setCustoUnitario('');
      setNumeroCupom('');
      setObservacao('');
      setBusca('');
      
      // Resetar data para hoje
      const hoje = new Date().toISOString().split('T')[0];
      setDataEntrada(hoje);
      
      // Recarregar produtos para atualizar estoque
      loadProdutos();
    } catch (error: any) {
      console.error('Erro ao registrar entrada:', error);
      alert(error.response?.data?.error || 'Erro ao registrar entrada de estoque');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-main px-4 md:px-8 py-8">
      <div className="mb-8">
        <h1 className="font-title text-3xl md:text-4xl font-bold text-text-primary mb-2">
          Movimento de Estoque
        </h1>
        <p className="text-text-secondary">
          Registre entradas de produtos no estoque
        </p>
      </div>

      <div className="card-primary max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seleção de Produto */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              <Package className="inline mr-2" size={16} />
              Produto *
            </label>
            
            {!produtoSelecionado ? (
              <>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar produto por nome, código interno ou código de barras..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="input-primary pl-10"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2 border border-purple-primary/30 rounded-lg p-2">
                  {produtosFiltrados.length === 0 ? (
                    <p className="text-text-secondary text-center py-4">
                      {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                    </p>
                  ) : (
                    produtosFiltrados.map((produto) => (
                      <button
                        key={produto.id}
                        type="button"
                        onClick={() => {
                          setProdutoSelecionado(produto);
                          setCustoUnitario(produto.custoMedio?.toString() || '');
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-purple-primary/10 transition border border-transparent hover:border-purple-primary/50"
                      >
                        <div className="font-medium text-text-primary">{produto.nome}</div>
                        <div className="text-sm text-text-secondary mt-1 space-y-1">
                          {produto.codigoInterno && (
                            <div>Código: {produto.codigoInterno}</div>
                          )}
                          {produto.codigoBarras && (
                            <div>Barras: {produto.codigoBarras}</div>
                          )}
                          <div className="flex gap-4">
                            <span>Estoque: {produto.estoque?.quantidade || 0} un</span>
                            <span>Custo Médio: R$ {produto.custoMedio?.toFixed(2) || '0.00'}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 bg-purple-primary/10 rounded-lg border border-purple-primary/30">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-text-primary text-lg">{produtoSelecionado.nome}</div>
                    <div className="text-sm text-text-secondary mt-2 space-y-1">
                      {produtoSelecionado.codigoInterno && (
                        <div>Código: {produtoSelecionado.codigoInterno}</div>
                      )}
                      {produtoSelecionado.codigoBarras && (
                        <div>Barras: {produtoSelecionado.codigoBarras}</div>
                      )}
                      <div>Estoque atual: {produtoSelecionado.estoque?.quantidade || 0} un</div>
                      <div>Custo médio atual: R$ {produtoSelecionado.custoMedio?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProdutoSelecionado(null);
                      setCustoUnitario('');
                    }}
                    className="text-red-action hover:text-red-action/80 text-sm"
                  >
                    Trocar
                  </button>
                </div>
              </div>
            )}
          </div>

          {produtoSelecionado && (
            <>
              {/* Data de Entrada */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <Calendar className="inline mr-2" size={16} />
                  Data de Entrada *
                </label>
                <input
                  type="date"
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  className="input-primary"
                  required
                />
              </div>

              {/* Número do Cupom */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <FileText className="inline mr-2" size={16} />
                  Número do Cupom Fiscal (opcional)
                </label>
                <input
                  type="text"
                  value={numeroCupom}
                  onChange={(e) => setNumeroCupom(e.target.value)}
                  className="input-primary"
                  placeholder="Ex: 12345"
                />
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  <TrendingUp className="inline mr-2" size={16} />
                  Quantidade Entrando *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="input-primary"
                  placeholder="Ex: 10"
                  required
                />
              </div>

              {/* Custo Unitário */}
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
                  className="input-primary"
                  placeholder="Ex: 15.50"
                  required
                />
                <p className="text-xs text-text-secondary mt-1">
                  O custo médio será recalculado automaticamente
                </p>
              </div>

              {/* Valor Total */}
              {quantidade && custoUnitario && (
                <div className="p-4 bg-green-action/10 rounded-lg border border-green-action/30">
                  <div className="text-sm text-text-secondary">Valor Total da Entrada</div>
                  <div className="text-2xl font-bold text-green-action">
                    R$ {(parseFloat(quantidade) * parseFloat(custoUnitario)).toFixed(2)}
                  </div>
                  <div className="text-xs text-text-secondary mt-1">
                    {quantidade} unidades × R$ {parseFloat(custoUnitario).toFixed(2)}
                  </div>
                </div>
              )}

              {/* Observação */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Observação (opcional)
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="input-primary"
                  rows={3}
                  placeholder="Ex: Nota fiscal 12345, Fornecedor XYZ..."
                />
              </div>

              {/* Botões */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Registrando...' : 'Registrar Entrada'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProdutoSelecionado(null);
                    setQuantidade('');
                    setCustoUnitario('');
                    setNumeroCupom('');
                    setObservacao('');
                  }}
                  className="btn-secondary px-6"
                >
                  Cancelar
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
