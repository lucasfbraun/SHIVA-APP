import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, DollarSign, ShoppingCart, Package, Trophy } from 'lucide-react';
import { relatorioService } from '@/services/relatorioService';
import { DashboardData } from '@/types';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const result = await relatorioService.getInicio();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao carregar início');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="title">Início</h1>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Comandas em Aberto */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Comanda em Aberto Hoje</p>
              <p className="text-3xl font-bold text-text-primary mt-2">
                {data?.resumo.totalComandas || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-primary/20 rounded-xl flex items-center justify-center">
              <ShoppingCart className="text-purple-highlight" size={24} />
            </div>
          </div>
        </div>

        {/* Previsão de Faturamento */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Previsão de Faturamento</p>
              <p className="text-3xl font-bold text-text-primary mt-2">
                R$ {data?.resumo.faturamentoTotal.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-primary/20 rounded-xl flex items-center justify-center">
              <DollarSign className="text-purple-highlight" size={24} />
            </div>
          </div>
        </div>

        {/* Ticket Médio em Aberto */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm font-medium">Ticket Médio em Aberto</p>
              <p className="text-3xl font-bold text-text-primary mt-2">
                R$ {data?.resumo.ticketMedio.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-primary/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-purple-highlight" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Produtos */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text-primary">Produtos Mais Vendidos</h2>
          <Package className="text-purple-primary" size={24} />
        </div>
        
        {data?.topProdutos && data.topProdutos.length > 0 ? (
          <div className="space-y-3">
            {data.topProdutos.map((produto, index) => (
              <div 
                key={produto.produtoId}
                className="flex items-center justify-between p-3 bg-background-primary rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-purple-highlight font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{produto.nome}</p>
                    <p className="text-sm text-text-secondary">
                      {produto.quantidade} unidades
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-purple-highlight">
                  R$ {produto.total.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">
            Nenhum produto vendido ainda
          </p>
        )}
      </div>

      {/* Ações Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/produtos/novo"
          className="card text-center hover:scale-105 transition-transform cursor-pointer"
        >
          <Package className="text-purple-primary mx-auto mb-3" size={32} />
          <h3 className="font-semibold text-text-primary">Novo Produto</h3>
          <p className="text-sm text-text-secondary mt-1">Cadastrar novo item</p>
        </Link>

        <Link
          to="/comandas"
          className="card text-center hover:scale-105 transition-transform cursor-pointer"
        >
          <ShoppingCart className="text-purple-primary mx-auto mb-3" size={32} />
          <h3 className="font-semibold text-text-primary">Abrir Comanda</h3>
          <p className="text-sm text-text-secondary mt-1">Iniciar novo atendimento</p>
        </Link>

        <Link
          to="/relatorios"
          className="card text-center hover:scale-105 transition-transform cursor-pointer"
        >
          <TrendingUp className="text-purple-primary mx-auto mb-3" size={32} />
          <h3 className="font-semibold text-text-primary">Ver Relatórios</h3>
          <p className="text-sm text-text-secondary mt-1">Análises detalhadas</p>
        </Link>

        <Link
          to="/sinuca"
          className="card text-center hover:scale-105 transition-transform cursor-pointer"
        >
          <Trophy className="text-purple-primary mx-auto mb-3" size={32} />
          <h3 className="font-semibold text-text-primary">Sinuca</h3>
          <p className="text-sm text-text-secondary mt-1">Partidas e torneios</p>
        </Link>
      </div>
    </div>
  );
}
