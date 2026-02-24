import api from './api';
import { Comanda, ItemComanda } from '@/types';

export const comandaService = {
  async getAll(status?: string) {
    const params = status ? `?status=${status}` : '';
    const { data } = await api.get<Comanda[]>(`/comandas${params}`);
    return data;
  },

  async getById(id: string) {
    const { data } = await api.get<Comanda>(`/comandas/${id}`);
    return data;
  },

  async create(nomeCliente: string, observacao?: string, clienteId?: string) {
    const { data } = await api.post<Comanda>('/comandas', {
      nomeCliente,
      observacao,
      clienteId
    });
    return data;
  },

  async adicionarItem(comandaId: string, produtoId: string, quantidade: number) {
    const { data } = await api.post<ItemComanda>(`/comandas/${comandaId}/itens`, {
      produtoId,
      quantidade
    });
    return data;
  },

  async removerItem(comandaId: string, itemId: string) {
    const { data } = await api.delete(`/comandas/${comandaId}/itens/${itemId}`);
    return data;
  },

  async fechar(id: string) {
    const { data } = await api.post<Comanda>(`/comandas/${id}/fechar`);
    return data;
  },

  async cancelar(id: string) {
    const { data } = await api.post<Comanda>(`/comandas/${id}/cancelar`);
    return data;
  },

  async pagarItens(id: string, itensIds: string[]) {
    const { data } = await api.post(`/comandas/${id}/pagar-itens`, { itensIds });
    return data;
  },

  async pagamentoParcial(id: string, valor: number) {
    const { data } = await api.post(`/comandas/${id}/pagamento-parcial`, { valor });
    return data;
  },

  async recalcular(id: string) {
    const { data } = await api.post(`/comandas/${id}/recalcular`);
    return data;
  },

  async atualizarDesconto(id: string, desconto: number, tipoDesconto: 'VALOR' | 'PERCENTUAL') {
    const { data } = await api.post(`/comandas/${id}/desconto`, { desconto, tipoDesconto });
    return data;
  }

};
