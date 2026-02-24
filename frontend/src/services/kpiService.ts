import api from './api';

export interface KPIFaturamentoAbonado {
  totalAbonado: number;
  custoTotal: number;
  percentualAbonado: number;
  qtdItensAbonados: number;
  totalFaturado: number;
  totalGeralVendido: number;
  graficoDiario: { [key: string]: number };
}

export const kpiService = {
  async getFaturamentoAbonado(dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (dataInicio) params.append('dataInicio', dataInicio);
    if (dataFim) params.append('dataFim', dataFim);
    
    const { data } = await api.get<KPIFaturamentoAbonado>(
      `/relatorios/vendas/faturamento-abonado?${params.toString()}`
    );
    return data;
  }
};
