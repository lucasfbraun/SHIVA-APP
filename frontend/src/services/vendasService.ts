import api from './api';
import { Venda, ItemVenda } from '@/types';

export interface CriarVendaInput {
  nomeCliente: string;
  clienteId?: string;
  tipoPagamento?: string;
  observacao?: string;
}

export interface AdicionarItemVendaInput {
  produtoId: string;
  quantidade: number;
  precoUnitario?: number;
  desconto?: number;
  tipoDesconto?: string;
}

export interface AplicarDescontoVendaInput {
  desconto: number;
  tipoDesconto?: string;
}

export interface FinalizarVendaInput {
  valorPago?: number;
  tipoPagamento?: string;
}

export const vendasService = {
  async getVendas(status?: string) {
    const params = status ? `?status=${status}` : '';
    const { data } = await api.get<Venda[]>(`/vendas${params}`);
    return data;
  },

  async getVendaById(id: string) {
    const { data } = await api.get<Venda>(`/vendas/${id}`);
    return data;
  },

  async criarVenda(payload: CriarVendaInput) {
    const { data } = await api.post<Venda>('/vendas', payload);
    return data;
  },

  async adicionarItem(vendaId: string, payload: AdicionarItemVendaInput) {
    const { data } = await api.post<ItemVenda>(`/vendas/${vendaId}/itens`, payload);
    return data;
  },

  async atualizarItem(vendaId: string, itemId: string, payload: Partial<AdicionarItemVendaInput>) {
    const { data } = await api.put<ItemVenda>(`/vendas/${vendaId}/itens/${itemId}`, payload);
    return data;
  },

  async removerItem(vendaId: string, itemId: string) {
    const { data } = await api.delete(`/vendas/${vendaId}/itens/${itemId}`);
    return data;
  },

  async aplicarDesconto(vendaId: string, payload: AplicarDescontoVendaInput) {
    const { data } = await api.put<Venda>(`/vendas/${vendaId}/desconto`, payload);
    return data;
  },

  async finalizarVenda(vendaId: string, payload: FinalizarVendaInput) {
    const { data } = await api.post<Venda>(`/vendas/${vendaId}/finalizar`, payload);
    return data;
  },

  async cancelarVenda(vendaId: string) {
    const { data } = await api.put<Venda>(`/vendas/${vendaId}/cancelar`, {});
    return data;
  }
};
