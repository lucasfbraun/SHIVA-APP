import { useEffect, useState } from 'react';
import { Trash2, Edit2, Plus } from 'lucide-react';
import { clienteService, ClienteData } from '@/services/clienteService';

export default function Clientes() {
  const [clientes, setClientes] = useState<ClienteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    telefone: '',
    cpf: ''
  });

  useEffect(() => {
    carregarClientes();
  }, []);

  const carregarClientes = async () => {
    try {
      setLoading(true);
      const data = await clienteService.getAll();
      setClientes(data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeCompleto.trim()) {
      alert('Nome completo é obrigatório');
      return;
    }

    try {
      if (editandoId) {
        await clienteService.update(editandoId, formData);
      } else {
        await clienteService.create(formData);
      }
      await carregarClientes();
      setFormData({ nomeCompleto: '', telefone: '', cpf: '' });
      setShowForm(false);
      setEditandoId(null);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar cliente');
    }
  };

  const handleEditar = (cliente: ClienteData) => {
    setFormData({
      nomeCompleto: cliente.nomeCompleto,
      telefone: cliente.telefone || '',
      cpf: cliente.cpf || ''
    });
    setEditandoId(cliente.id || null);
    setShowForm(true);
  };

  const handleDeletar = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este cliente?')) {
      try {
        await clienteService.delete(id);
        await carregarClientes();
      } catch (error) {
        alert('Erro ao deletar cliente');
      }
    }
  };

  const handleCancelar = () => {
    setShowForm(false);
    setEditandoId(null);
    setFormData({ nomeCompleto: '', telefone: '', cpf: '' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="title">Clientes</h1>
          <p className="text-text-secondary mt-2">Gerencie seus clientes cadastrados</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="text-xl font-bold text-purple-primary mb-4">
              {editandoId ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  Nome Completo <span className="text-red-action">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Digite o nome completo"
                  value={formData.nomeCompleto}
                  onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Telefone</label>
                <input
                  type="tel"
                  className="input"
                  placeholder="(11) 98765-4321"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div>
                <label className="label">CPF</label>
                <input
                  type="text"
                  className="input"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editandoId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabela de Clientes */}
      <div className="card">
        {clientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-primary/30">
                  <th className="px-4 py-3 text-left text-text-secondary font-semibold">Nome</th>
                  <th className="px-4 py-3 text-left text-text-secondary font-semibold">Telefone</th>
                  <th className="px-4 py-3 text-left text-text-secondary font-semibold">CPF</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Total Gasto</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Comandas</th>
                  <th className="px-4 py-3 text-right text-text-secondary font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-purple-primary/10 hover:bg-background-primary/50">
                    <td className="px-4 py-3 font-medium text-text-primary">{cliente.nomeCompleto}</td>
                    <td className="px-4 py-3 text-text-secondary">{cliente.telefone || '-'}</td>
                    <td className="px-4 py-3 text-text-secondary">{cliente.cpf || '-'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-purple-primary">
                      R$ {cliente.totalGasto?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-4 py-3 text-right text-text-secondary">
                      {cliente.qtdComandas || 0}
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEditar(cliente)}
                        className="btn-icon text-blue-500 hover:text-blue-400"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletar(cliente.id!)}
                        className="btn-icon text-red-action hover:text-red-500"
                        title="Deletar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-text-secondary">Nenhum cliente cadastrado</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-purple-primary hover:text-purple-highlight mt-4 font-semibold"
            >
              Cadastre o primeiro cliente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
