import api from './api';
import { DashboardData } from '@/types';

export const relatorioService = {
  async getDashboard(dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get<DashboardData>(`/relatorios/dashboard?${params}`);
    return data;
  },

  async getTicketMedio(dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get(`/relatorios/ticket-medio?${params}`);
    return data;
  },

  async getProdutosMaisVendidos(limite = 10, dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    params.append('limite', String(limite));
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get(`/relatorios/produtos-mais-vendidos?${params}`);
    return data;
  },

  async getFaturamento(periodo: 'dia' | 'semana' | 'mes', dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    params.append('periodo', periodo);
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get(`/relatorios/faturamento?${params}`);
    return data;
  },

  async getMargemLucro(dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get(`/relatorios/margem-lucro?${params}`);
    return data;
  },

  async getResumo(dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get(`/relatorios/resumo?${params}`);
    return data;
  },

  async getTopClientes(limite = 10, dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    params.append('limite', String(limite));
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get(`/relatorios/top-clientes/ranking?${params}`);
    return data;
  }
};
