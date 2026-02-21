import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Package, BarChart3 } from 'lucide-react';
import { relatorioService } from '@/services/relatorioService';

export default function Relatorios() {
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30'); // últimos 30 dias
  const [ticketMedio, setTicketMedio] = useState<any>(null);
  const [topProdutos, setTopProdutos] = useState<any[]>([]);
  const [margemLucro, setMargemLucro] = useState<any>(null);

  useEffect(() => {
    loadRelatorios();
  }, [periodo]);

  const loadRelatorios = async () => {
    try {
      setLoading(true);
      
      const hoje = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - parseInt(periodo));

      const [ticket, produtos, margem] = await Promise.all([
        relatorioService.getTicketMedio(dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getProdutosMaisVendidos(5, dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getMargemLucro(dataInicio.toISOString(), hoje.toISOString())
      ]);

      setTicketMedio(ticket);
      setTopProdutos(produtos);
      setMargemLucro(margem);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="title">Relatórios</h1>
          <p className="text-text-secondary mt-2">Análise de desempenho</p>
        </div>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="input"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm">Total Comandas</p>
            <BarChart3 className="text-purple-primary" size={20} />
          </div>
          <p className="text-3xl font-bold text-text-primary">
            {ticketMedio?.totalComandas || 0}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm">Faturamento</p>
            <DollarSign className="text-purple-primary" size={20} />
          </div>
          <p className="text-3xl font-bold text-purple-highlight">
            R$ {ticketMedio?.faturamentoTotal?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm">Ticket Médio</p>
            <TrendingUp className="text-purple-primary" size={20} />
          </div>
          <p className="text-3xl font-bold text-text-primary">
            R$ {ticketMedio?.ticketMedio?.toFixed(2) || '0.00'}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-text-secondary text-sm">Margem de Lucro</p>
            <TrendingUp className="text-purple-primary" size={20} />
          </div>
          <p className="text-3xl font-bold text-green-400">
            {margemLucro?.margemPercentual?.toFixed(2) || '0.00'}%
          </p>
        </div>
      </div>

      {/* Margem Detalhada */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Análise de Margem</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-text-secondary text-sm mb-1">Faturamento Total</p>
            <p className="text-2xl font-bold text-text-primary">
              R$ {margemLucro?.faturamentoTotal?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Custo Total</p>
            <p className="text-2xl font-bold text-red-400">
              R$ {margemLucro?.custoTotal?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-text-secondary text-sm mb-1">Lucro</p>
            <p className="text-2xl font-bold text-green-400">
              R$ {margemLucro?.lucro?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      </div>

      {/* Top Produtos */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-text-primary">Top 5 Produtos</h2>
          <Package className="text-purple-primary" size={24} />
        </div>

        {topProdutos.length > 0 ? (
          <div className="space-y-4">
            {topProdutos.map((produto, index) => (
              <div key={produto.produtoId} className="p-4 bg-background-primary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-purple-highlight font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{produto.nome}</p>
                      {produto.categoria && (
                        <p className="text-sm text-text-secondary">{produto.categoria}</p>
                      )}
                    </div>
                  </div>
                  <p className="font-semibold text-purple-highlight">
                    R$ {produto.faturamento?.toFixed(2)}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-purple-primary/20">
                  <div>
                    <p className="text-xs text-text-secondary">Qtd Vendida</p>
                    <p className="font-medium text-text-primary">{produto.quantidadeVendida}</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Margem</p>
                    <p className="font-medium text-green-400">
                      R$ {produto.margem?.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary">Margem %</p>
                    <p className="font-medium text-green-400">
                      {produto.margemPercentual}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary text-center py-8">Nenhum dado disponível</p>
        )}
      </div>
    </div>
  );
}
