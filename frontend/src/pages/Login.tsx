import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<'login' | 'register'>('login');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    nome: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErro('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      if (modo === 'login') {
        await authService.login({
          email: formData.email,
          senha: formData.senha
        });
      } else {
        await authService.register({
          email: formData.email,
          senha: formData.senha,
          nome: formData.nome
        });
      }
      navigate('/');
    } catch (error: any) {
      setErro(error.message || 'Erro ao autenticar');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-primary via-background-secondary to-background-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.jpeg" 
            alt="SHIVA" 
            className="w-20 h-20 rounded-lg object-cover shadow-glow-purple mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-text-primary">SHIVA</h1>
          <p className="text-text-secondary text-sm mt-2">Sistema de Gestão para Conveniência</p>
        </div>

        {/* Card */}
        <div className="bg-background-secondary border border-purple-primary/30 rounded-2xl p-8 shadow-glow-purple">
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => {
                setModo('login');
                setErro('');
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                modo === 'login'
                  ? 'bg-purple-primary text-white'
                  : 'bg-background-primary text-text-secondary hover:bg-purple-primary/10'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setModo('register');
                setErro('');
              }}
              className={`flex-1 py-2 rounded-lg font-medium transition ${
                modo === 'register'
                  ? 'bg-purple-primary text-white'
                  : 'bg-background-primary text-text-secondary hover:bg-purple-primary/10'
              }`}
            >
              Registrar
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'register' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Seu nome"
                  required={modo === 'register'}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input w-full"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Senha
              </label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className="input w-full"
                placeholder="••••••••"
                required
              />
            </div>

            {erro && (
              <div className="p-3 bg-red-action/10 border border-red-action/30 rounded-lg text-red-action text-sm">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="btn-primary w-full disabled:opacity-50"
            >
              {carregando ? 'Processando...' : (modo === 'login' ? 'Entrar' : 'Criar Conta')}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-text-secondary text-xs mt-6">
          Sistema SHIVA © 2026
        </p>
      </div>
    </div>
  );
}
