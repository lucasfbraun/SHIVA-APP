import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { despesaService, Despesa } from '@/services/despesaService';

const categorias = [
  'Aluguel',
  'Água',
  'Luz',
  'Internet',
  'Combustível',
  'Uber',
  'Limpeza',
  'Manutenção',
  'Alimentação',
  'Outro'
];

export default function Despesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: 'Outro',
    tipo: 'VARIÁVEL' as 'FIXA' | 'VARIÁVEL',
    data: new Date().toISOString().split('T')[0],
    isRecorrente: false,
    mesesRecorrencia: 1,
    mesInicio: new Date().getMonth() + 1,
    anoInicio: new Date().getFullYear(),
    observacao: ''
  });

  useEffect(() => {
    loadDespesas();
  }, [mes, ano]);

  const loadDespesas = async () => {
    try {
      setLoading(true);
      const data = await despesaService.getAll({ mes, ano });
      setDespesas(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'valor' ? parseFloat(value) || '' : value
    }));
  };

  const handleCheckbox = (name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.descricao || !formData.valor || !formData.categoria) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setProcessando(true);
      
      if (editando) {
        await despesaService.update(editando, formData);
      } else {
        await despesaService.create(formData);
      }

      setModalAberto(false);
      setEditando(null);
      setFormData({
        descricao: '',
        valor: '',
        categoria: 'Outro',
        tipo: 'VARIÁVEL',
        data: new Date().toISOString().split('T')[0],
        isRecorrente: false,
        mesesRecorrencia: 1,
        mesInicio: new Date().getMonth() + 1,
        anoInicio: new Date().getFullYear(),
        observacao: ''
      });
      loadDespesas();
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa');
    } finally {
      setProcessando(false);
    }
  };

  const handleEdit = (despesa: Despesa) => {
    setFormData({
      descricao: despesa.descricao,
      valor: despesa.valor.toString(),
      categoria: despesa.categoria,
      tipo: despesa.tipo,
      data: despesa.data.split('T')[0],
      isRecorrente: despesa.isRecorrente || false,
      mesesRecorrencia: despesa.mesesRecorrencia || 1,
      mesInicio: despesa.mesInicio || new Date().getMonth() + 1,
      anoInicio: despesa.anoInicio || new Date().getFullYear(),
      observacao: despesa.observacao || ''
    });
    setEditando(despesa.id);
    setModalAberto(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente deletar esta despesa?')) return;
    
    try {
      await despesaService.delete(id);
      loadDespesas();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar despesa');
    }
  };

  const handleTogglePago = async (despesa: Despesa) => {
    try {
      await despesaService.update(despesa.id, {
        paga: !despesa.paga,
        dataPagamento: !despesa.paga ? new Date().toISOString() : undefined
      });
      loadDespesas();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    }
  };

  const totalGeral = despesas.reduce((sum, d) => sum + d.valor, 0);
  const totalPago = despesas.filter(d => d.paga).reduce((sum, d) => sum + d.valor, 0);
  const totalAberto = totalGeral - totalPago;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="title">Despesas</h1>
          <p className="text-text-secondary mt-2">Controle suas finanças do mês</p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setFormData({
              descricao: '',
              valor: '',
              categoria: 'Outro',
              tipo: 'VARIÁVEL',
              data: new Date().toISOString().split('T')[0],
              isRecorrente: false,
              mesesRecorrencia: 1,
              mesInicio: new Date().getMonth() + 1,
              anoInicio: new Date().getFullYear(),
              observacao: ''
            });
            setModalAberto(true);
          }}
          className="btn-primary flex items-center space-x-2 justify-center"
        >
          <Plus size={20} />
          <span>Nova Despesa</span>
        </button>
      </div>

      {/* Seletor de Mês/Ano */}
      <div className="card flex gap-4">
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="input"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="input"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={ano - 2 + i}>
              {ano - 2 + i}
            </option>
          ))}
        </select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card border border-purple-primary/30 bg-background-secondary/50">
          <p className="text-text-secondary text-sm">Total</p>
          <p className="text-3xl font-bold text-purple-primary mt-2">
            R$ {totalGeral.toFixed(2)}
          </p>
        </div>
        <div className="card border border-green-500/30 bg-background-secondary/50">
          <p className="text-text-secondary text-sm">Pago</p>
          <p className="text-3xl font-bold text-green-500 mt-2">
            R$ {totalPago.toFixed(2)}
          </p>
        </div>
        <div className="card border border-red-action/30 bg-background-secondary/50">
          <p className="text-text-secondary text-sm">Aberto</p>
          <p className="text-3xl font-bold text-red-action mt-2">
            R$ {totalAberto.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Lista de Despesas */}
      {loading ? (
        <div className="card text-center py-8">
          <p className="text-text-secondary">Carregando...</p>
        </div>
      ) : despesas.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-text-secondary">Nenhuma despesa neste período</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-purple-primary/30">
              <tr>
                <th className="text-left p-3 text-text-secondary text-sm font-medium">Descrição</th>
                <th className="text-left p-3 text-text-secondary text-sm font-medium">Categoria</th>
                <th className="text-left p-3 text-text-secondary text-sm font-medium">Tipo</th>
                <th className="text-right p-3 text-text-secondary text-sm font-medium">Valor</th>
                <th className="text-center p-3 text-text-secondary text-sm font-medium">Status</th>
                <th className="text-center p-3 text-text-secondary text-sm font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-primary/10">
              {despesas.map(despesa => (
                <tr key={despesa.id} className="hover:bg-background-primary/50 transition">
                  <td className="p-3 text-text-primary">{despesa.descricao}</td>
                  <td className="p-3 text-text-secondary text-sm">{despesa.categoria}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      despesa.tipo === 'FIXA' 
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-purple-primary/20 text-purple-highlight'
                    }`}>
                      {despesa.tipo}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-text-primary">
                    R$ {despesa.valor.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleTogglePago(despesa)}
                      className={`px-3 py-1 rounded-lg text-sm flex items-center justify-center mx-auto gap-1 transition ${
                        despesa.paga
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-action/20 text-red-action'
                      }`}
                    >
                      {despesa.paga ? (
                        <>
                          <Check size={16} />
                          Pago
                        </>
                      ) : (
                        <>
                          <X size={16} />
                          Aberto
                        </>
                      )}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleEdit(despesa)}
                        className="p-2 text-purple-primary hover:bg-purple-primary/10 rounded-lg transition"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(despesa.id)}
                        className="p-2 text-red-action hover:bg-red-action/10 rounded-lg transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Despesa */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-background-secondary border border-purple-primary/30 rounded-2xl p-6 max-w-2xl w-full shadow-glow-purple max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              {editando ? 'Editar Despesa' : 'Nova Despesa'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    name="descricao"
                    value={formData.descricao}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Ex: Aluguel, Água, Luz"
                    required
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    name="valor"
                    value={formData.valor}
                    onChange={handleChange}
                    step="0.01"
                    className="input w-full"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Categoria *
                  </label>
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    {categorias.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className="input w-full"
                    required
                  />
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Tipo *
                  </label>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="VARIÁVEL">Variável</option>
                    <option value="FIXA">Fixa</option>
                  </select>
                </div>

                {/* Recorrente */}
                {formData.tipo === 'FIXA' && (
                  <>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="isRecorrente"
                        checked={formData.isRecorrente}
                        onChange={() => handleCheckbox('isRecorrente')}
                        id="recorrente"
                        className="w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="recorrente" className="text-sm text-text-primary cursor-pointer">
                        Despesa recorrente por vários meses?
                      </label>
                    </div>

                    {formData.isRecorrente && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Quantos meses?
                          </label>
                          <input
                            type="number"
                            name="mesesRecorrencia"
                            value={formData.mesesRecorrencia}
                            onChange={handleChange}
                            min="1"
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Mês de início
                          </label>
                          <select
                            name="mesInicio"
                            value={formData.mesInicio}
                            onChange={handleChange}
                            className="input w-full"
                          >
                            {Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                {new Date(2024, i).toLocaleString('pt-BR', { month: 'long' })}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-primary mb-2">
                            Ano de início
                          </label>
                          <input
                            type="number"
                            name="anoInicio"
                            value={formData.anoInicio}
                            onChange={handleChange}
                            className="input w-full"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Observação */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Observação
                  </label>
                  <textarea
                    name="observacao"
                    value={formData.observacao}
                    onChange={handleChange}
                    className="input w-full h-20 resize-none"
                    placeholder="Notas adicionais (opcional)"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setEditando(null);
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
                  {processando ? 'Salvando...' : (editando ? 'Atualizar' : 'Lançar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
