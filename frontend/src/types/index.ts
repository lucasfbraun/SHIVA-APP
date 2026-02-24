export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  codigoInterno?: string;
  codigoBarras?: string;
  unidadeMedida?: string;
  quantidadeRefCalculo?: number;
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
  desconto: number;
  tipoDesconto: 'VALOR' | 'PERCENTUAL';
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
  custoUnitario: number;
  subtotal: number;
  pago: boolean;
  abonado: boolean;
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

export type VendaStatus = 'ABERTA' | 'FINALIZADA' | 'CANCELADA';
export type TipoPagamento = 'DINHEIRO' | 'CARTAO' | 'FIADO';
export type TipoDesconto = 'VALOR' | 'PERCENTUAL';

export interface ItemVenda {
  id: string;
  vendaId: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  custoUnitario: number;
  desconto: number;
  tipoDesconto: TipoDesconto;
  subtotal: number;
  criadoEm: string;
  produto?: {
    nome: string;
    imagemUrl?: string;
  };
}

export interface Venda {
  id: string;
  numeroVenda: number;
  clienteId?: string | null;
  nomeCliente?: string | null;
  status: VendaStatus;
  subtotal: number;
  desconto: number;
  tipoDesconto: TipoDesconto;
  total: number;
  valorPago: number;
  valorRestante: number;
  tipoPagamento: TipoPagamento;
  dataAbertura: string;
  dataFechamento?: string | null;
  observacao?: string | null;
  itens?: ItemVenda[];
  cliente?: {
    id: string;
    nomeCompleto: string;
  } | null;
}

export type SinucaTipoPartida = 'UNICA' | 'MELHOR_DE';
export type SinucaStatusPartida = 'PENDENTE' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';

export interface SinucaPartida {
  id: string;
  tipo: SinucaTipoPartida;
  melhorDe: number;
  clienteAId: string;
  clienteBId: string;
  vitoriasA: number;
  vitoriasB: number;
  status: SinucaStatusPartida;
  vencedorId?: string | null;
  observacao?: string | null;
  criadoEm: string;
  atualizadoEm: string;
  clienteA?: { id: string; nomeCompleto: string };
  clienteB?: { id: string; nomeCompleto: string };
  vencedor?: { id: string; nomeCompleto: string } | null;
}

export type SinucaTipoTorneio = 'TODOS_CONTRA_TODOS' | 'CHAVEAMENTO';
export type SinucaStatusTorneio = 'RASCUNHO' | 'EM_ANDAMENTO' | 'FINALIZADO';

export interface SinucaTorneioParticipante {
  id: string;
  torneioId: string;
  clienteId: string;
  pontos: number;
  vitorias: number;
  derrotas: number;
  cliente?: { id: string; nomeCompleto: string };
}

export interface SinucaTorneioPartida {
  id: string;
  torneioId: string;
  rodada: number;
  clienteAId: string;
  clienteBId: string;
  vitoriasA: number;
  vitoriasB: number;
  status: SinucaStatusPartida;
  vencedorId?: string | null;
  melhorDe: number;
  clienteA?: { id: string; nomeCompleto: string };
  clienteB?: { id: string; nomeCompleto: string };
  vencedor?: { id: string; nomeCompleto: string } | null;
}

export interface SinucaTorneio {
  id: string;
  nome: string;
  tipo: SinucaTipoTorneio;
  melhorDe: number;
  status: SinucaStatusTorneio;
  criadoEm: string;
  atualizadoEm: string;
  participantes?: SinucaTorneioParticipante[];
  partidas?: SinucaTorneioPartida[];
  _count?: { participantes: number; partidas: number };
}
