import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function GraficoFaturamentoVsDespesasVsLucro({ dados }: { dados: any[] }) {
  console.log('Dados do gráfico 1:', dados);
  
  if (!dados || dados.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center h-80 space-y-2">
        <p className="text-text-secondary text-center">Sem dados para exibir</p>
        <p className="text-xs text-text-secondary">Crie algumas comandas para ver os gráficos</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-purple-primary mb-4">Faturamento vs Despesas vs Lucro</h2>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={dados}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#6C2BD9/20" />
          <XAxis dataKey="mes" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A2E',
              border: '1px solid #6C2BD9',
              borderRadius: '8px',
              color: '#E0E7FF'
            }}
            formatter={(value) => `R$ ${(value as number).toFixed(2)}`}
          />
          <Legend />
          <Bar
            dataKey="faturamento"
            fill="#6C2BD9"
            radius={[8, 8, 0, 0]}
            name="Faturamento"
          />
          <Bar
            dataKey="despesas"
            fill="#EF4444"
            radius={[8, 8, 0, 0]}
            name="Despesas"
          />
          <Bar
            dataKey="lucroLiquido"
            fill="#22C55E"
            radius={[8, 8, 0, 0]}
            name="Lucro Líquido"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function GraficoMargensBrutaVsLiquida({ dados }: { dados: any[] }) {
  console.log('Dados do gráfico 2:', dados);
  
  if (!dados || dados.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center h-80 space-y-2">
        <p className="text-text-secondary text-center">Sem dados para exibir</p>
        <p className="text-xs text-text-secondary">Crie algumas comandas para ver os gráficos</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-purple-primary mb-4">Margem Bruta vs Margem Líquida</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={dados}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#6C2BD9/20" />
          <XAxis dataKey="mes" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" label={{ value: 'Percentual (%)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A1A2E',
              border: '1px solid #6C2BD9',
              borderRadius: '8px',
              color: '#E0E7FF'
            }}
            formatter={(value) => `${(value as number).toFixed(1)}%`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="margemGrossa"
            stroke="#A78BFA"
            strokeWidth={3}
            dot={{ fill: '#A78BFA', r: 5 }}
            activeDot={{ r: 7 }}
            name="Margem Bruta"
          />
          <Line
            type="monotone"
            dataKey="margemLiquida"
            stroke="#10B981"
            strokeWidth={3}
            dot={{ fill: '#10B981', r: 5 }}
            activeDot={{ r: 7 }}
            name="Margem Líquida"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
