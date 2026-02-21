import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { despesaService } from '@/services/despesaService';

export default function RelatorioDespesas() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState<any>(null);

  useEffect(() => {
    loadResumo();
  }, [mes, ano]);

  const loadResumo = async () => {
    try {
      setLoading(true);
      const data = await despesaService.getResumo(mes, ano);
      setResumo(data);
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMesNome = (m: number) => {
    return new Date(2024, m - 1).toLocaleString('pt-BR', { month: 'long' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="title">Relatório de Despesas</h1>
        <p className="text-text-secondary mt-2">Análise detalhada de suas despesas</p>
      </div>

      {/* Seletor de Período */}
      <div className="card flex gap-4">
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="input"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {getMesNome(i + 1)}
            </option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="input"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={ano - 2 + i}>
              {ano - 2 + i}
            </option>
          ))}
        </select>
      </div>

      {loading || !resumo ? (
        <div className="card text-center py-8">
          <p className="text-text-secondary">Carregando...</p>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Geral */}
            <div className="card border border-purple-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total de Despesas</p>
                  <p className="text-3xl font-bold text-purple-primary mt-2">
                    R$ {resumo.totalGeral.toFixed(2)}
                  </p>
                </div>
                <DollarSign size={32} className="text-purple-primary opacity-20" />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {resumo.despesas.length} lançamentos
              </p>
            </div>

            {/* Total Pago */}
            <div className="card border border-green-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Despesas Pagas</p>
                  <p className="text-3xl font-bold text-green-500 mt-2">
                    R$ {resumo.totalPago.toFixed(2)}
                  </p>
                </div>
                <TrendingDown size={32} className="text-green-500 opacity-20" />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {((resumo.totalPago / resumo.totalGeral) * 100 || 0).toFixed(1)}% normalizado
              </p>
            </div>

            {/* Total Aberto */}
            <div className="card border border-red-action/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Despesas em Aberto</p>
                  <p className="text-3xl font-bold text-red-action mt-2">
                    R$ {resumo.totalAberto.toFixed(2)}
                  </p>
                </div>
                <TrendingUp size={32} className="text-red-action opacity-20" />
              </div>
              <p className="text-xs text-text-secondary mt-2">
                {((resumo.totalAberto / resumo.totalGeral) * 100 || 0).toFixed(1)}% pendente
              </p>
            </div>
          </div>

          {/* Gráfico de Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Por Tipo */}
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Despesas por Tipo</h3>
              <div className="space-y-3">
                {Object.entries(resumo.porTipo).map(([tipo, valor]: any) => {
                  const percentual = (valor / resumo.totalGeral) * 100;
                  return (
                    <div key={tipo}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-text-secondary">{tipo}</span>
                        <span className="font-semibold">R$ {valor.toFixed(2)}</span>
                      </div>
                      <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            tipo === 'FIXA' ? 'bg-blue-500' : 'bg-purple-primary'
                          }`}
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Por Categoria */}
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Despesas por Categoria</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(resumo.porCategoria)
                  .sort((a: any, b: any) => b[1].total - a[1].total)
                  .map(([categoria, data]: any) => {
                    const percentual = (data.total / resumo.totalGeral) * 100;
                    return (
                      <div key={categoria}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-text-secondary">
                            {categoria} <span className="text-xs opacity-70">({data.itemCount})</span>
                          </span>
                          <span className="font-semibold">R$ {data.total.toFixed(2)}</span>
                        </div>
                        <div className="w-full bg-background-primary rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-primary to-purple-highlight"
                            style={{ width: `${percentual}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Tabela de Detalhes */}
          {resumo.despesas.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-text-primary mb-4">Detalhes do Período</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-purple-primary/30">
                    <tr>
                      <th className="text-left p-2 text-text-secondary">Descrição</th>
                      <th className="text-left p-2 text-text-secondary">Categoria</th>
                      <th className="text-left p-2 text-text-secondary">Tipo</th>
                      <th className="text-right p-2 text-text-secondary">Valor</th>
                      <th className="text-center p-2 text-text-secondary">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-primary/10">
                    {resumo.despesas.map((despesa: any) => (
                      <tr key={despesa.id} className="hover:bg-background-primary/50">
                        <td className="p-2 text-text-primary">{despesa.descricao}</td>
                        <td className="p-2 text-text-secondary text-xs">{despesa.categoria}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            despesa.tipo === 'FIXA'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-primary/20 text-purple-highlight'
                          }`}>
                            {despesa.tipo}
                          </span>
                        </td>
                        <td className="p-2 text-right font-semibold">R$ {despesa.valor.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            despesa.paga
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-action/20 text-red-action'
                          }`}>
                            {despesa.paga ? 'Pago' : 'Aberto'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
