const API_URL = '/api/auth';

export interface LoginData {
  email: string;
  senha: string;
}

export interface RegisterData {
  email: string;
  senha: string;
  nome: string;
}

export interface AuthResponse {
  usuario: {
    id: string;
    email: string;
    nome: string;
  };
  token: string;
}

// Helper para fazer parse seguro de JSON
const safeJsonParse = async (response: Response): Promise<any> => {
  const text = await response.text();
  if (!text || text.trim() === '') {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Erro ao fazer parse de JSON:', e);
    throw new Error('Resposta inválida do servidor');
  }
};

export const authService = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao fazer login');
    }

    localStorage.setItem('token', result.token);
    localStorage.setItem('usuario', JSON.stringify(result.usuario));
    return result;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(result.error || 'Erro ao registrar');
    }

    localStorage.setItem('token', result.token);
    localStorage.setItem('usuario', JSON.stringify(result.usuario));
    return result;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getUsuario: () => {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  }
};
