import api from './api';
import { Produto } from '@/types';

export const produtoService = {
  async getAll(filtros?: { ativo?: boolean; categoria?: string; controlaEstoque?: boolean }) {
    const params = new URLSearchParams();
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    if (filtros?.controlaEstoque !== undefined) params.append('controlaEstoque', String(filtros.controlaEstoque));
    
    // Adicionar timestamp para evitar cache
    params.append('_t', Date.now().toString());
    
    const { data } = await api.get<Produto[]>(`/produtos?${params}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<Produto>(`/produtos/${id}`);
    return data;
  },

  async create(formData: FormData) {
    const { data } = await api.post<Produto>('/produtos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async update(id: string, formData: FormData) {
    const { data } = await api.put<Produto>(`/produtos/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  async delete(id: string) {
    const { data } = await api.delete(`/produtos/${id}`);
    return data;
  },

  async calcularPreco(custoMedio: number, markup: number) {
    const { data } = await api.post<{ precoSugerido: string }>('/produtos/calcular-preco', {
      custoMedio,
      markup
    });
    return data;
  },

  async registrarEntradaEstoque(entrada: {
    produtoId: string;
    quantidade: number;
    custoUnitario: number;
    dataEntrada?: string;
    numeroCupom?: string;
    observacao?: string;
  }) {
    const { data } = await api.post('/estoque/entrada', entrada);
    return data;
  }
};
