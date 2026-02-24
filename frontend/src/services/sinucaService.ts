import api from './api';
import {
  SinucaPartida,
  SinucaTorneio,
  SinucaTorneioPartida,
  SinucaTipoPartida,
  SinucaTipoTorneio
} from '@/types';

export interface CriarPartidaInput {
  clienteAId: string;
  clienteBId: string;
  tipo: SinucaTipoPartida;
  melhorDe?: number;
  observacao?: string;
}

export interface AtualizarPartidaInput {
  vitoriasA?: number;
  vitoriasB?: number;
  status?: string;
}

export interface CriarTorneioInput {
  nome: string;
  tipo: SinucaTipoTorneio;
  melhorDe: number;
  participantes: string[];
}

export interface AtualizarTorneioPartidaInput {
  vitoriasA?: number;
  vitoriasB?: number;
  status?: string;
}

export const sinucaService = {
  async getPartidas() {
    const { data } = await api.get<SinucaPartida[]>('/sinuca/partidas');
    return data;
  },

  async createPartida(payload: CriarPartidaInput) {
    const { data } = await api.post<SinucaPartida>('/sinuca/partidas', payload);
    return data;
  },

  async updatePartida(id: string, payload: AtualizarPartidaInput) {
    const { data } = await api.put<SinucaPartida>(`/sinuca/partidas/${id}`, payload);
    return data;
  },

  async getTorneios() {
    const { data } = await api.get<SinucaTorneio[]>('/sinuca/torneios');
    return data;
  },

  async getTorneioById(id: string) {
    const { data } = await api.get<SinucaTorneio>(`/sinuca/torneios/${id}`);
    return data;
  },

  async createTorneio(payload: CriarTorneioInput) {
    const { data } = await api.post<SinucaTorneio>('/sinuca/torneios', payload);
    return data;
  },

  async updateTorneioPartida(torneioId: string, partidaId: string, payload: AtualizarTorneioPartidaInput) {
    const { data } = await api.put<SinucaTorneioPartida>(
      `/sinuca/torneios/${torneioId}/partidas/${partidaId}`,
      payload
    );
    return data;
  }
};
