import api from './api';

export interface ComponenteEngenharia {
  id: string;
  produtoId: string;
  componenteId: string;
  quantidade: number;
  criadoEm: string;
  atualizadoEm: string;
  componente?: {
    id: string;
    nome: string;
    custoMedio: number;
    codigoInterno?: string;
    categoria?: string;
  };
}

export const engenhariaService = {
  async getEngenharia(produtoId: string): Promise<ComponenteEngenharia[]> {
    const { data } = await api.get<ComponenteEngenharia[]>(`/produtos/${produtoId}/engenharia`);
    return data;
  },

  async adicionarComponente(produtoId: string, componenteId: string, quantidade: number): Promise<ComponenteEngenharia> {
    const { data } = await api.post<ComponenteEngenharia>(`/produtos/${produtoId}/engenharia`, {
      componenteId,
      quantidade
    });
    return data;
  },

  async removerComponente(produtoId: string, componenteId: string): Promise<void> {
    await api.delete(`/produtos/${produtoId}/engenharia/${componenteId}`);
  },

  async calcularCusto(produtoId: string): Promise<any> {
    const { data } = await api.post(`/produtos/${produtoId}/engenharia/calcular-custo`);
    return data;
  }
};
