import api from './api';
import { Produto } from '@/types';

export const produtoService = {
  async getAll(filtros?: { ativo?: boolean; categoria?: string }) {
    const params = new URLSearchParams();
    if (filtros?.ativo !== undefined) params.append('ativo', String(filtros.ativo));
    if (filtros?.categoria) params.append('categoria', filtros.categoria);
    
    const { data } = await api.get<Produto[]>(`/produtos?${params}`);
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
  }
};
