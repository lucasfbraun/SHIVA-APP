import api from './api';

export interface ClienteData {
  id?: string;
  nomeCompleto: string;
  telefone?: string;
  cpf?: string;
  totalGasto?: number;
  qtdComandas?: number;
  criadoEm?: string;
  atualizadoEm?: string;
}

export const clienteService = {
  async getAll() {
    const { data } = await api.get<ClienteData[]>('/clientes');
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<ClienteData>(`/clientes/${id}`);
    return data;
  },

  async create(cliente: ClienteData) {
    const { data } = await api.post<ClienteData>('/clientes', cliente);
    return data;
  },

  async update(id: string, cliente: Partial<ClienteData>) {
    const { data } = await api.put<ClienteData>(`/clientes/${id}`, cliente);
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/clientes/${id}`);
    return data;
  }
};
