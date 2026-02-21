import api from './api';

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  tipo: 'FIXA' | 'VARIÁVEL';
  data: string;
  isRecorrente?: boolean;
  mesesRecorrencia?: number;
  mesInicio?: number;
  anoInicio?: number;
  observacao?: string;
  paga: boolean;
  dataPagamento?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export const despesaService = {
  create: async (data: Partial<Despesa>) => {
    const response = await api.post('/despesas', data);
    return response.data;
  },

  getAll: async (filtros?: {
    tipo?: string;
    categoria?: string;
    mes?: number;
    ano?: number;
    paga?: boolean;
  }) => {
    const response = await api.get('/despesas', { params: filtros });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/despesas/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<Despesa>) => {
    const response = await api.put(`/despesas/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/despesas/${id}`);
    return response.data;
  },

  getResumo: async (mes: number, ano: number) => {
    const response = await api.get('/despesas/relatorio/resumo', {
      params: { mes, ano }
    });
    return response.data;
  }
};
