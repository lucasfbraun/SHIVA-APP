import api from './api';

export interface EntradaEstoque {
  id: string;
  produtoId: string;
  quantidade: number;
  custoUnitario: number;
  dataEntrada: string;
  numeroCupom: string | null;
  tipoEntrada: 'MANUAL' | 'OCR';
  tipoMovimento: 'ENTRADA' | 'SAIDA';
  comandaId: string | null;
  observacao: string | null;
  criadoEm: string;
  saldoAnterior?: number;
  saldoAtual?: number;
  produto: {
    id: string;
    nome: string;
    categoria: string | null;
    codigoInterno: string | null;
    codigoBarras: string | null;
    estoque?: {
      quantidade: number;
    } | null;
  };
  comanda?: {
    numeroComanda: number;
  } | null;
}

export const estoqueService = {
  async getEntradas(filtros?: {
    produtoId?: string;
    tipoEntrada?: 'MANUAL' | 'OCR';
    tipoMovimento?: 'ENTRADA' | 'SAIDA' | 'COMANDA';
    dataInicio?: string;
    dataFim?: string;
  }) {
    const params = new URLSearchParams();
    if (filtros?.produtoId) params.append('produtoId', filtros.produtoId);
    if (filtros?.tipoEntrada) params.append('tipoEntrada', filtros.tipoEntrada);
    if (filtros?.tipoMovimento) params.append('tipoMovimento', filtros.tipoMovimento);
    if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
    if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
    
    const { data } = await api.get<EntradaEstoque[]>(`/estoque/entradas?${params}`);
    return data;
  }
};
