export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  codigoInterno?: string;
  codigoBarras?: string;
  unidadeMedida?: string;
  custoMedio: number;
  precoVenda: number;
  imagemUrl?: string;
  markup?: number;
  tipo?: 'COMPRADO' | 'FABRICADO';
  controlaEstoque?: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  estoque?: Estoque;
  engenharias?: EngenhariaProduto[];
}

export interface EngenhariaProduto {
  id: string;
  produtoId: string;
  componenteId: string;
  quantidade: number;
  criadoEm: string;
  atualizadoEm: string;
  componente?: Produto;
}

export interface Estoque {
  id: string;
  produtoId: string;
  quantidade: number;
  atualizadoEm: string;
}

export interface EntradaEstoque {
  id: string;
  produtoId: string;
  quantidade: number;
  custoUnitario: number;
  observacao?: string;
  criadoEm: string;
  produto?: {
    nome: string;
    categoria?: string;
  };
}

export interface Comanda {
  id: string;
  numeroComanda: number;
  nomeCliente: string;
  status: 'ABERTA' | 'FECHADA' | 'CANCELADA';
  total: number;
  valorPago: number;
  valorRestante: number;
  dataAbertura: string;
  dataFechamento?: string;
  observacao?: string;
  itens?: ItemComanda[];
}

export interface ItemComanda {
  id: string;
  comandaId: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  pago: boolean;
  criadoEm: string;
  produto?: {
    nome: string;
    imagemUrl?: string;
  };
}

export interface OCRCupom {
  id: string;
  imagemUrl: string;
  status: 'PENDENTE' | 'PROCESSADO' | 'ERRO';
  itensDetectados?: ItemOCR[];
  criadoEm: string;
  processadoEm?: string;
}

export interface ItemOCR {
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

export interface DashboardData {
  periodo: {
    inicio: string;
    fim: string;
  };
  resumo: {
    totalComandas: number;
    faturamentoTotal: number;
    ticketMedio: number;
  };
  topProdutos: Array<{
    produtoId: string;
    nome: string;
    quantidade: number;
    total: number;
  }>;
  faturamentoPorDia: { [key: string]: number };
}
