import { useEffect, useState, useMemo } from 'react';
import { Trash2, Plus, ShoppingCart, DollarSign, X } from 'lucide-react';
import { clienteService, ClienteData } from '@/services/clienteService';
import { produtoService } from '@/services/produtoService';
import { vendasService } from '@/services/vendasService';
import { Produto, Venda, ItemVenda, VendaStatus, TipoPagamento } from '@/types';

export default function Vendas() {
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendaAtual, setVendaAtual] = useState<Venda | null>(null);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [precoCustomizado, setPrecoCustomizado] = useState<Record<string, number>>({});
  const [desconto, setDesconto] = useState({ valor: 0, tipo: 'VALOR' as const });
  const [modalFinalizacao, setModalFinalizacao] = useState(false);
  const [pagamento, setPagamento] = useState({ valor: 0, tipo: 'DINHEIRO' as TipoPagamento });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      const [clientesData, produtosData, vendasData] = await Promise.all([
        clienteService.getAll(),
        produtoService.getAll(),
        vendasService.getVendas()
      ]);
      setClientes(clientesData);
      setProdutos(produtosData);
      setVendas(vendasData);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setCarregando(false);
    }
  };

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.toLowerCase();
    if (!termo) return clientes;
    return clientes.filter((c) =>
      c.nomeCompleto.toLowerCase().includes(termo) ||
      (c.telefone && c.telefone.includes(termo)) ||
      (c.cpf && c.cpf.includes(termo))
    );
  }, [buscaCliente, clientes]);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.toLowerCase();
    if (!termo) return produtos;
    return produtos.filter((p) =>
      p.nome.toLowerCase().includes(termo) ||
      (p.codigoBarras && p.codigoBarras.includes(termo))
    );
  }, [buscaProduto, produtos]);

  const novaVenda = async (nomeCliente: string, clienteId?: string) => {
    try {
      const venda = await vendasService.criarVenda({
        nomeCliente,
        clienteId: clienteId || undefined
      });
      setVendaAtual(venda);
      setBuscaCliente('');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao criar venda');
    }
  };

  const adicionarAoCarrinho = async (produto: Produto) => {
    if (!vendaAtual) return;

    try {
      const preco = precoCustomizado[produto.id] || produto.precoVenda;
      const item = await vendasService.adicionarItem(vendaAtual.id, {
        produtoId: produto.id,
        quantidade: 1,
        precoUnitario: preco
      });

      setVendaAtual((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          itens: [...(prev.itens || []), item],
          total: prev.total + item.subtotal
        };
      });

      setPrecoCustomizado((prev) => {
        const novo = { ...prev };
        delete novo[produto.id];
        return novo;
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao adicionar item');
    }
  };

  const removerDoCarrinho = async (itemId: string) => {
    if (!vendaAtual) return;

    try {
      await vendasService.removerItem(vendaAtual.id, itemId);
      setVendaAtual((prev) => {
        if (!prev) return prev;
        const item = prev.itens?.find((i) => i.id === itemId);
        return {
          ...prev,
          itens: prev.itens?.filter((i) => i.id !== itemId) || [],
          total: item ? prev.total - item.subtotal : prev.total
        };
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao remover item');
    }
  };

  const atualizarQuantidade = async (itemId: string, novaQtd: number) => {
    if (!vendaAtual || novaQtd < 1) return;

    try {
      const itemAtualizado = await vendasService.atualizarItem(vendaAtual.id, itemId, {
        quantidade: novaQtd
      });

      setVendaAtual((prev) => {
        if (!prev) return prev;
        const itemAntigo = prev.itens?.find((i) => i.id === itemId);
        const diferenca = itemAtualizado.subtotal - (itemAntigo?.subtotal || 0);
        return {
          ...prev,
          itens: prev.itens?.map((i) => (i.id === itemId ? itemAtualizado : i)) || [],
          total: prev.total + diferenca
        };
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao atualizar quantidade');
    }
  };

  const aplicarDesconto = async () => {
    if (!vendaAtual || desconto.valor <= 0) return;

    try {
      const vendaAtualizada = await vendasService.aplicarDesconto(vendaAtual.id, {
        desconto: desconto.valor,
        tipoDesconto: desconto.tipo
      });
      setVendaAtual(vendaAtualizada);
      setDesconto({ valor: 0, tipo: 'VALOR' });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao aplicar desconto');
    }
  };

  const finalizarVenda = async () => {
    if (!vendaAtual || !vendaAtual.itens || vendaAtual.itens.length === 0) {
      alert('Venda sem itens');
      return;
    }

    try {
      const vendaFinalizada = await vendasService.finalizarVenda(vendaAtual.id, {
        valorPago: pagamento.valor,
        tipoPagamento: pagamento.tipo
      });

      setVendaAtual(null);
      setModalFinalizacao(false);
      setPagamento({ valor: 0, tipo: 'DINHEIRO' });
      setDesconto({ valor: 0, tipo: 'VALOR' });
      await carregarDados();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao finalizar venda');
    }
  };

  const cancelarVenda = async () => {
    if (!vendaAtual) return;

    if (!confirm('Tem certeza que deseja cancelar esta venda?')) return;

    try {
      await vendasService.cancelarVenda(vendaAtual.id);
      setVendaAtual(null);
      await carregarDados();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao cancelar venda');
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  if (!vendaAtual) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="title">PDV - Vendas</h1>
          <p className="text-text-secondary mt-2">Gerencie suas vendas e controle de estoque</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Nova Venda</h2>
              <p className="text-text-secondary text-sm mb-4">Selecione um cliente ou crie uma venda anônima</p>

              <div className="space-y-3">
                <input
                  type="text"
                  className="input"
                  placeholder="Buscar cliente..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                />

                <div className="max-h-40 overflow-y-auto border border-purple-primary/20 rounded-lg p-2 space-y-2">
                  {clientesFiltrados.map((cliente) => (
                    <button
                      key={cliente.id}
                      className="w-full text-left p-2 hover:bg-background-primary/70 rounded-lg transition text-text-primary"
                      onClick={() => novaVenda(cliente.nomeCompleto, cliente.id)}
                    >
                      <p className="font-medium">{cliente.nomeCompleto}</p>
                      <p className="text-xs text-text-secondary">{cliente.telefone}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const nome = prompt('Nome do cliente:');
                    if (nome) novaVenda(nome);
                  }}
                  className="btn-primary w-full"
                >
                  <Plus size={20} /> Venda Anônima
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-semibold text-text-primary mb-4">Histórico de Vendas</h2>
              {vendas.length === 0 ? (
                <p className="text-text-secondary">Nenhuma venda realizada</p>
              ) : (
                <div className="space-y-2">
                  {vendas.slice(0, 10).map((venda) => (
                    <div
                      key={venda.id}
                      className="p-3 bg-background-primary/60 rounded-lg border border-purple-primary/10"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-text-primary">Venda #{venda.numeroVenda}</p>
                          <p className="text-sm text-text-secondary">
                            {venda.nomeCliente} • {venda.itens?.length || 0} itens
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-purple-highlight">
                            R$ {venda.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-text-secondary">{venda.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="card flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Venda #{vendaAtual.numeroVenda}
            </h2>
            <button
              onClick={cancelarVenda}
              className="text-red-action hover:bg-red-action/10 p-2 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-sm text-text-secondary mb-3">
            Cliente: {vendaAtual.nomeCliente}
          </p>

          <input
            type="text"
            className="input mb-4"
            placeholder="Buscar produto..."
            value={buscaProduto}
            onChange={(e) => setBuscaProduto(e.target.value)}
          />

          <div className="overflow-y-auto space-y-2 flex-1">
            {produtosFiltrados.map((produto) => (
              <div key={produto.id} className="flex items-center gap-3 p-2 bg-background-primary/60 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{produto.nome}</p>
                  <p className="text-xs text-text-secondary">
                    R$ {produto.precoVenda.toFixed(2)} • Estoque: {produto.estoque?.quantidade || 0}
                  </p>
                </div>
                <input
                  type="number"
                  step="0.01"
                  className="w-16 input text-center text-sm"
                  placeholder="Preço"
                  onChange={(e) => {
                    if (e.target.value) {
                      setPrecoCustomizado((prev) => ({ ...prev, [produto.id]: Number(e.target.value) }));
                    }
                  }}
                />
                <button
                  onClick={() => adicionarAoCarrinho(produto)}
                  className="btn-secondary"
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="card flex-1 overflow-hidden flex flex-col">
          <h3 className="text-lg font-semibold text-text-primary mb-3">Carrinho</h3>

          <div className="overflow-y-auto flex-1 space-y-2 mb-4">
            {vendaAtual.itens && vendaAtual.itens.length > 0 ? (
              vendaAtual.itens.map((item) => (
                <div key={item.id} className="p-2 bg-background-primary/60 rounded-lg border border-purple-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-text-primary text-sm truncate">{item.nomeProduto}</p>
                    <button
                      onClick={() => removerDoCarrinho(item.id)}
                      className="text-red-action hover:bg-red-action/10 p-1 rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
                    <input
                      type="number"
                      min="1"
                      className="w-12 input text-center text-xs"
                      value={item.quantidade}
                      onChange={(e) => atualizarQuantidade(item.id, Number(e.target.value))}
                    />
                    <span>x</span>
                    <span>R$ {item.precoUnitario.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Subtotal:</span>
                    <span className="font-semibold text-text-primary">R$ {item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-secondary text-center py-8">Nenhum item no carrinho</p>
            )}
          </div>

          <div className="border-t border-purple-primary/20 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Subtotal:</span>
              <span className="font-semibold text-text-primary">R$ {vendaAtual.subtotal.toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <label className="label text-xs">Desconto</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input flex-1 text-sm"
                  placeholder="Valor"
                  value={desconto.valor}
                  onChange={(e) => setDesconto({ ...desconto, valor: Number(e.target.value) })}
                />
                <select
                  className="input w-20 text-sm"
                  value={desconto.tipo}
                  onChange={(e) => setDesconto({ ...desconto, tipo: e.target.value as any })}
                >
                  <option value="VALOR">R$</option>
                  <option value="PERCENTUAL">%</option>
                </select>
                <button onClick={aplicarDesconto} className="btn-secondary text-sm">
                  Aplicar
                </button>
              </div>
            </div>

            {vendaAtual.desconto > 0 && (
              <div className="flex items-center justify-between text-orange-400">
                <span className="text-sm">Desconto ({vendaAtual.tipoDesconto === 'PERCENTUAL' ? vendaAtual.desconto + '%' : 'R$ ' + vendaAtual.desconto.toFixed(2)}):</span>
                <span className="font-semibold">-R$ {Math.abs(vendaAtual.subtotal - vendaAtual.total).toFixed(2)}</span>
              </div>
            )}

            <div className="bg-purple-primary/10 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">Total:</span>
                <span className="text-2xl font-bold text-purple-highlight">R$ {vendaAtual.total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setModalFinalizacao(true)}
              disabled={!vendaAtual.itens || vendaAtual.itens.length === 0}
              className="btn-primary w-full disabled:opacity-50"
            >
              <ShoppingCart size={20} /> Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {modalFinalizacao && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card w-full max-w-md">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Finalizar Venda</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="label">Total:</label>
                <p className="text-3xl font-bold text-purple-highlight">R$ {vendaAtual.total.toFixed(2)}</p>
              </div>

              <div>
                <label className="label">Tipo de Pagamento</label>
                <select
                  className="input"
                  value={pagamento.tipo}
                  onChange={(e) => setPagamento({ ...pagamento, tipo: e.target.value as TipoPagamento })}
                >
                  <option value="DINHEIRO">Dinheiro</option>
                  <option value="CARTAO">Cartão</option>
                  <option value="FIADO">Fiado</option>
                </select>
              </div>

              {pagamento.tipo !== 'FIADO' && (
                <div>
                  <label className="label">Valor Recebido</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    placeholder="0.00"
                    value={pagamento.valor}
                    onChange={(e) => setPagamento({ ...pagamento, valor: Number(e.target.value) })}
                  />
                  {pagamento.valor > vendaAtual.total && (
                    <p className="text-sm text-green-400 mt-2">
                      Troco: R$ {(pagamento.valor - vendaAtual.total).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalFinalizacao(false)}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarVenda}
                className="btn-primary flex-1"
              >
                <DollarSign size={20} /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
