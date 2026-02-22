import axios from 'axios';
import { authService } from './authService';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Transformar resposta vazia em objeto vazio
  transformResponse: [(data) => {
    // Se não há dados, retorna objeto vazio
    if (!data || data === '' || data.length === 0) {
      console.warn('API retornou resposta vazia');
      return {};
    }
    
    // Se já é um objeto, retorna direto
    if (typeof data === 'object') {
      return data;
    }
    
    // Tenta fazer parse de JSON
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Erro ao fazer parse de JSON:', data, e);
      // Se falhar, retorna os dados como estão
      return data;
    }
  }],
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use((config) => {
  const token = authService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para redirecionar ao login em caso de 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Erro na API:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      authService.logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
