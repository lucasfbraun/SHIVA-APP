import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, Package, DollarSign, RefreshCw, Gift } from 'lucide-react';
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
  const [itensSelecionados, setItensSelecionados] = useState<string[]>([]);
  const [valorParcial, setValorParcial] = useState('');
  const [desconto, setDesconto] = useState('0');
  const [tipoDesconto, setTipoDesconto] = useState<'VALOR' | 'PERCENTUAL'>('VALOR');
  const [atualizandoDesconto, setAtualizandoDesconto] = useState(false);

  useEffect(() => {
    loadComanda();
    loadProdutos();
  }, [id]);

  const loadComanda = async () => {
    try {
      setLoading(true);
      const data = await comandaService.getById(id!);
      setComanda(data);
      setDesconto(data.desconto?.toString() || '0');
      setTipoDesconto(data.tipoDesconto || 'VALOR');
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

  const handleAbonarItem = async (itemId: string) => {
    if (!confirm('Deseja abonar este item?')) return;

    try {
      await comandaService.abonarItem(id!, itemId);
      loadComanda();
    } catch (error: any) {
      console.error('Erro ao abonar item:', error);
      alert(error.response?.data?.error || 'Erro ao abonar item');
    }
  };

  const handlePagarItens = async () => {
    if (itensSelecionados.length === 0) {
      alert('Selecione pelo menos um item para pagar');
      return;
    }

    try {
      await comandaService.pagarItens(id!, itensSelecionados);
      setItensSelecionados([]);
      loadComanda();
    } catch (error: any) {
      console.error('Erro ao pagar itens:', error);
      alert(error.response?.data?.error || 'Erro ao pagar itens');
    }
  };

  const handlePagamentoParcial = async () => {
    const valor = parseFloat(valorParcial);
    if (!valor || valor <= 0) {
      alert('Digite um valor válido');
      return;
    }

    const saldoAtual = Math.abs(comanda?.valorRestante || 0) < 0.01 ? 0 : (comanda?.valorRestante || 0);
    
    if (valor > saldoAtual + 0.01) {
      alert(`Valor excede o saldo devedor: R$ ${saldoAtual.toFixed(2)}`);
      return;
    }

    try {
      await comandaService.pagamentoParcial(id!, valor);
      setValorParcial('');
      await loadComanda();
      // Aguardar um pouco para garantir a renderização
      setTimeout(() => {
        console.log('Pagamento registrado, comanda recarregada');
      }, 100);
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      alert(error.response?.data?.error || 'Erro ao registrar pagamento');
    }
  };

  const handleRecalcular = async () => {
    if (!confirm('Recalcular valores da comanda? Isso irá corrigir valores incorretos.')) return;

    try {
      await comandaService.recalcular(id!);
      loadComanda();
      alert('Valores recalculados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao recalcular:', error);
      alert(error.response?.data?.error || 'Erro ao recalcular valores');
    }
  };

  const handleAtualizarDesconto = async () => {
    const descontoNum = parseFloat(desconto);
    if (isNaN(descontoNum) || descontoNum < 0) {
      alert('Digite um valor válido para o desconto');
      return;
    }

    try {
      setAtualizandoDesconto(true);
      await comandaService.atualizarDesconto(id!, descontoNum, tipoDesconto);
      loadComanda();
    } catch (error: any) {
      console.error('Erro ao atualizar desconto:', error);
      alert(error.response?.data?.error || 'Erro ao atualizar desconto');
    } finally {
      setAtualizandoDesconto(false);
    }
  };

  const toggleItemSelecionado = (itemId: string) => {
    setItensSelecionados(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
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
  const saldoDevedor = Math.abs(comanda.valorRestante || 0) < 0.01 ? 0 : comanda.valorRestante;

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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">Resumo Financeiro</h3>
          {isAberta && (
            <button
              onClick={handleRecalcular}
              className="text-sm px-3 py-1.5 rounded-lg bg-purple-primary/20 text-purple-highlight hover:bg-purple-primary/30 transition flex items-center gap-2"
            >
              <RefreshCw size={14} />
              <span>Recalcular</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
          <div>
            <p className="text-text-secondary text-sm">Pago</p>
            <p className="text-2xl font-bold text-green-400 mt-1">
              R$ {(comanda.valorPago || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Saldo Devedor</p>
            <p className="text-2xl font-bold text-yellow-400 mt-1">
              R$ {saldoDevedor.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Resumo com Desconto */}
        {comanda.desconto > 0 && (
          <div className="bg-background-primary rounded-lg p-4 mb-4 border border-purple-primary/30">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-text-primary">
                <span>Total</span>
                <span className="font-semibold">R$ {comanda.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-yellow-400">
                <span>Desconto ({comanda.tipoDesconto === 'PERCENTUAL' ? 
                  ((comanda.desconto / comanda.total) * 100).toFixed(1) + '%' : 'Fixo'})</span>
                <span className="font-semibold">-R$ {comanda.desconto.toFixed(2)}</span>
              </div>
              <div className="border-t border-purple-primary/20 pt-2 flex justify-between text-text-primary font-semibold">
                <span>Saldo Final</span>
                <span className="text-purple-highlight">R$ {saldoDevedor.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Resumo com Itens Abonados */}
        {comanda.itens && comanda.itens.some(i => i.abonado) && (
          <div className="bg-yellow-500/5 rounded-lg p-4 mb-4 border border-yellow-500/30">
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-yellow-300 mb-3">Itens Abonados</p>
              {comanda.itens.filter(i => i.abonado).map(item => (
                <div key={item.id} className="flex justify-between text-text-secondary">
                  <span>{item.nomeProduto} ({item.quantidade}x)</span>
                  <span>-R$ {item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-yellow-500/20 pt-2 flex justify-between text-yellow-300 font-semibold">
                <span>Total Abonado</span>
                <span>
                  -R$ {comanda.itens
                    .filter(i => i.abonado)
                    .reduce((sum, i) => sum + i.subtotal, 0)
                    .toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
        {isAberta && (
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary w-full flex items-center justify-center space-x-2 mt-4"
          >
            <Plus size={20} />
            <span>Adicionar Item</span>
          </button>
        )}
      </div>

      {/* Desconto */}
      {isAberta && (
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Desconto</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Tipo
                </label>
                <select
                  value={tipoDesconto}
                  onChange={(e) => setTipoDesconto(e.target.value as 'VALOR' | 'PERCENTUAL')}
                  className="input w-full"
                >
                  <option value="VALOR">Valor (R$)</option>
                  <option value="PERCENTUAL">Percentual (%)</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Desconto
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={tipoDesconto === 'PERCENTUAL' ? '100' : comanda.total}
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  placeholder={tipoDesconto === 'VALOR' ? 'R$' : '%'}
                  className="input w-full"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAtualizarDesconto}
                  disabled={atualizandoDesconto}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {atualizandoDesconto ? 'Atualizando...' : 'Aplicar'}
                </button>
              </div>
            </div>
            {comanda.desconto > 0 && (
              <div className="text-sm text-text-secondary">
                💰 Desconto aplicado: R$ {comanda.desconto.toFixed(2)}
                {tipoDesconto === 'PERCENTUAL' && ` (${((comanda.desconto / comanda.total) * 100).toFixed(1)}%)`}
              </div>
            )}
            <p className="text-text-secondary text-sm bg-purple-primary/10 p-3 rounded-lg">
              ℹ️ Se houver desconto, a comanda só poderá ser fechada através de "Adicionar Pagamento (Rachar Conta)"
            </p>
          </div>
        </div>
      )}

      {/* Itens */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">Itens da Comanda</h2>
          {isAberta && itensSelecionados.length > 0 && (comanda.desconto || 0) === 0 && (
            <button
              onClick={handlePagarItens}
              className="btn-primary flex items-center space-x-2"
            >
              <CheckCircle size={18} />
              <span>Pagar {itensSelecionados.length} item(ns)</span>
            </button>
          )}
        </div>
        
        {(comanda.desconto || 0) > 0 && isAberta && (
          <div className="mb-4 p-3 bg-yellow-400/10 border border-yellow-400/30 rounded-lg">
            <p className="text-sm text-yellow-300">
              ⚠️ Com desconto aplicado, não é possível marcar itens como pagos individualmente.
            </p>
            <p className="text-sm text-text-secondary mt-1">
              Use "Adicionar Pagamento (Rachar Conta)" para registrar os pagamentos.
            </p>
          </div>
        )}
        
        {comanda.itens && comanda.itens.length > 0 ? (
          <div className="space-y-3">
            {comanda.itens.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 rounded-lg ${
                  item.abonado
                    ? 'bg-yellow-500/10 border border-yellow-500/30 opacity-60'
                    : item.pago 
                    ? 'bg-green-500/10 border border-green-500/30' 
                    : 'bg-background-primary'
                }`}
              >
                {isAberta && !item.pago && (comanda.desconto || 0) === 0 && (
                  <input
                    type="checkbox"
                    checked={itensSelecionados.includes(item.id)}
                    onChange={() => toggleItemSelecionado(item.id)}
                    className="mr-3 w-5 h-5"
                  />
                )}
                {isAberta && !item.pago && (comanda.desconto || 0) > 0 && (
                  <div
                    className="mr-3 w-5 h-5 rounded border-2 border-gray-500/30 bg-gray-500/10 cursor-not-allowed"
                    title="Marcar itens como pagos está desabilitado quando há desconto. Use Adicionar Pagamento."
                  />
                )}
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary">{item.nomeProduto}</p>
                      {item.abonado && (
                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-300 rounded-full">
                          ABONADO
                        </span>
                      )}
                      {item.pago && (
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                          PAGO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">
                      {item.quantidade} x R$ {item.precoUnitario.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <p className="font-semibold text-purple-highlight">
                    R$ {item.subtotal.toFixed(2)}
                  </p>
                  {isAberta && !item.pago && !item.abonado && (
                    <button
                      onClick={() => handleAbonarItem(item.id)}
                      className="p-2 rounded-lg hover:bg-yellow-400/10 transition-colors"
                      title="Abonar item"
                    >
                      <Gift className="text-yellow-400" size={20} />
                    </button>
                  )}
                  {isAberta && !item.pago && (
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

      {/* Pagamento Parcial */}
      {isAberta && (
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Adicionar Pagamento (Rachar Conta)
          </h2>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={comanda.valorRestante}
                value={valorParcial}
                onChange={(e) => setValorParcial(e.target.value)}
                placeholder={`Máx: R$ ${comanda.valorRestante.toFixed(2)}`}
                className="input w-full"
              />
            </div>
            <button
              onClick={handlePagamentoParcial}
              disabled={!valorParcial || parseFloat(valorParcial) <= 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <DollarSign size={20} />
              <span>Registrar Pagamento</span>
            </button>
          </div>
          <p className="text-text-secondary text-sm mt-2">
            👥 Exemplo: Cliente vai pagar R$ 50,00 da comanda de R$ {comanda.total.toFixed(2)}
          </p>
        </div>
      )}

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
            disabled={
              !comanda.itens || 
              comanda.itens.length === 0 || 
              Math.abs(saldoDevedor) > 0.01
            }
            className="btn-primary flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              Math.abs(saldoDevedor) > 0.01
                ? `Saldo devedor: R$ ${saldoDevedor.toFixed(2)} - Pague antes de fechar!`
                : 'Fechar comanda e dar baixa no estoque'
            }
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
                      {produto.nome} - R$ {produto.precoVenda.toFixed(2)} {produto.controlaEstoque !== false && `(Estoque: ${produto.estoque?.quantidade || 0})`}
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
