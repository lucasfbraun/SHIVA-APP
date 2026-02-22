import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { engenhariaService, ComponenteEngenharia } from '@/services/engenhariaService';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';

interface EngenhariaModalProps {
  produtoId: string;
  produtoNome: string;
  custoMedio: number;
  onClose: () => void;
  onSave: (novosCusto: number) => void;
}

export default function EngenhariaModal({ produtoId, produtoNome, custoMedio, onClose, onSave }: EngenhariaModalProps) {
  const [componentes, setComponentes] = useState<ComponenteEngenharia[]>([]);
  const [todasProdutos, setTodasProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [componenteSelecionado, setComponenteSelecionado] = useState('');
  const [quantidade, setQuantidade] = useState('1');

  useEffect(() => {
    carregarDados();
  }, [produtoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [eng, prods] = await Promise.all([
        engenhariaService.getEngenharia(produtoId),
        produtoService.getAll()
      ]);
      setComponentes(eng);
      setTodasProdutos(prods.filter(p => p.id !== produtoId));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionarComponente = async () => {
    if (!componenteSelecionado || !quantidade || parseFloat(quantidade) <= 0) {
      alert('Selecione um componente e informe uma quantidade válida');
      return;
    }

    try {
      setSalvando(true);
      const novoComponente = await engenhariaService.adicionarComponente(
        produtoId,
        componenteSelecionado,
        parseFloat(quantidade)
      );
      setComponentes([...componentes, novoComponente]);
      setComponenteSelecionado('');
      setQuantidade('1');
    } catch (error) {
      console.error('Erro ao adicionar componente:', error);
      alert('Erro ao adicionar componente');
    } finally {
      setSalvando(false);
    }
  };

  const handleRemoverComponente = async (componenteId: string) => {
    if (!confirm('Tem certeza que deseja remover este componente?')) {
      return;
    }

    try {
      setSalvando(true);
      await engenhariaService.removerComponente(produtoId, componenteId);
      setComponentes(componentes.filter(c => c.componenteId !== componenteId));
    } catch (error) {
      console.error('Erro ao remover componente:', error);
      alert('Erro ao remover componente');
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarCusto = async () => {
    try {
      setSalvando(true);
      const resultado = await engenhariaService.calcularCusto(produtoId);
      alert(`Custo médio atualizado para R$ ${resultado.custoMedio.toFixed(2)}`);
      onSave(resultado.custoMedio);
      onClose();
    } catch (error) {
      console.error('Erro ao calcular custo:', error);
      alert('Erro ao calcular custo');
    } finally {
      setSalvando(false);
    }
  };

  const custoTotal = componentes.reduce((acc, comp) => {
    return acc + ((comp.componente?.custoMedio || 0) * comp.quantidade);
  }, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-surface-primary rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-surface-primary rounded-lg p-6 max-w-3xl w-full mx-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-text-primary">
            Engenharia: {produtoNome}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-background-secondary rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Adicionar Componente */}
        <div className="card mb-6">
          <h3 className="font-semibold text-text-primary mb-4">Adicionar Componente</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={componenteSelecionado}
              onChange={(e) => setComponenteSelecionado(e.target.value)}
              className="input col-span-2"
            >
              <option value="">Selecione um produto...</option>
              {todasProdutos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} - R$ {p.custoMedio.toFixed(2)}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="Qtd"
              className="input"
            />

            <button
              onClick={handleAdicionarComponente}
              disabled={salvando}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              Adicionar
            </button>
          </div>
        </div>

        {/* Componentes da Engenharia */}
        <div className="card mb-6">
          <h3 className="font-semibold text-text-primary mb-4">Componentes</h3>
          
          {componentes.length === 0 ? (
            <p className="text-text-secondary text-center py-4">Nenhum componente adicionado</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-primary/30">
                    <th className="text-left py-2 px-4 font-medium text-text-secondary">Componente</th>
                    <th className="text-left py-2 px-4 font-medium text-text-secondary">Cód. Interno</th>
                    <th className="text-right py-2 px-4 font-medium text-text-secondary">Qtd</th>
                    <th className="text-right py-2 px-4 font-medium text-text-secondary">Custo Unit.</th>
                    <th className="text-right py-2 px-4 font-medium text-text-secondary">Subtotal</th>
                    <th className="text-center py-2 px-4 font-medium text-text-secondary">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {componentes.map((comp) => (
                    <tr key={comp.id} className="border-b border-purple-primary/10 hover:bg-purple-primary/5">
                      <td className="py-3 px-4 text-text-primary font-medium">{comp.componente?.nome}</td>
                      <td className="py-3 px-4 text-text-secondary text-sm">{comp.componente?.codigoInterno || '-'}</td>
                      <td className="py-3 px-4 text-text-primary text-right">{comp.quantidade}</td>
                      <td className="py-3 px-4 text-text-primary text-right">
                        R$ {(comp.componente?.custoMedio || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-text-primary text-right font-semibold">
                        R$ {((comp.componente?.custoMedio || 0) * comp.quantidade).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleRemoverComponente(comp.componenteId)}
                          disabled={salvando}
                          className="p-1 text-red-action hover:bg-red-action/10 rounded transition disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-purple-primary/5">
                    <td colSpan={4} className="py-3 px-4 font-semibold text-text-primary text-right">
                      Custo Total da Engenharia:
                    </td>
                    <td className="py-3 px-4 font-bold text-purple-primary text-right text-lg">
                      R$ {custoTotal.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="card mb-6 bg-purple-primary/5 border border-purple-primary/20">
          <div className="space-y-2">
            <p className="text-text-secondary">
              <span className="font-medium">Custo Médio Atual:</span> R$ {custoMedio.toFixed(2)}
            </p>
            <p className="text-text-secondary">
              <span className="font-medium">Custo Calculado:</span> R$ {custoTotal.toFixed(2)}
            </p>
            {custoTotal !== custoMedio && (
              <p className="text-sm text-orange-500">
                ⚠️ Clique em "Salvar e Atualizar Custo" para sincronizar o custo médio
              </p>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-purple-primary/30 text-text-primary hover:bg-background-secondary transition"
            disabled={salvando}
          >
            Fechar
          </button>
          <button
            onClick={handleSalvarCusto}
            disabled={salvando || componentes.length === 0}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white rounded-lg transition font-medium"
          >
            {salvando ? 'Salvando...' : 'Salvar e Atualizar Custo'}
          </button>
        </div>
      </div>
    </div>
  );
}
