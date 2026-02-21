import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Package, BarChart3, TrendingDown, ShoppingCart, AlertCircle, Zap } from 'lucide-react';
import { relatorioService } from '@/services/relatorioService';
import { despesaService } from '@/services/despesaService';
import { GraficoFaturamentoVsDespesasVsLucro, GraficoMargensBrutaVsLiquida } from '@/components/GraficosRelatorio';

export default function Relatorios() {
  const [abaSelecionada, setAbaSelecionada] = useState<'vendas' | 'despesas'>('vendas');
  const [loading, setLoading] = useState(true);
  
  // Vendas
  const [periodo, setPeriodo] = useState('30');
  const [ticketMedio, setTicketMedio] = useState<any>(null);
  const [topProdutos, setTopProdutos] = useState<any[]>([]);
  const [margemLucro, setMargemLucro] = useState<any>(null);
  const [topClientes, setTopClientes] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [dadosMensais, setDadosMensais] = useState<any[]>([]);

  // Despesas
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [resumoDespesas, setResumoDespesas] = useState<any>(null);

  useEffect(() => {
    if (abaSelecionada === 'vendas') {
      loadRelatorioVendas();
    } else {
      loadRelatorioDespesas();
    }
  }, [abaSelecionada, periodo, mes, ano]);

  const loadRelatorioVendas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando loadRelatorioVendas...');
      
      const hoje = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(hoje.getDate() - parseInt(periodo));

      console.log('Período selecionado:', periodo);
      console.log('Data início:', dataInicio.toISOString());
      console.log('Data fim:', hoje.toISOString());

      const [ticketData, produtosData, margemData, clientesData, resumoData, dadosMensaisData] = await Promise.all([
        relatorioService.getTicketMedio(dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getProdutosMaisVendidos(5, dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getMargemLucro(dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getTopClientes(10, dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getResumo(dataInicio.toISOString(), hoje.toISOString()),
        relatorioService.getMensal(12)
      ]);

      console.log('✅ Todos os endpoints retornados');
      console.log('resumoData:', resumoData);
      console.log('dadosMensaisData:', dadosMensaisData);

      // Extrair o valor de ticketMedio do objeto retornado
      setTicketMedio(ticketData?.ticketMedio || 0);
      // Processar produtos
      const produtos = Array.isArray(produtosData) ? produtosData : (produtosData?.produtos || []);
      setTopProdutos(produtos);
      // Extrair a margem do objeto retornado
      setMargemLucro(margemData?.margemPercentual || 0);
      // Processar clientes
      const clientes = Array.isArray(clientesData) ? clientesData : [];
      setTopClientes(clientes);
      // Resumo completo
      setResumo(resumoData);
      // Dados mensais
      console.log('📊 Dados mensais recebidos:', dadosMensaisData);
      const meses = Array.isArray(dadosMensaisData) ? dadosMensaisData : [];
      console.log('📊 Meses processados:', meses);
      console.log('📊 Quantidade de meses:', meses.length);
      setDadosMensais(meses);
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      setTicketMedio(0);
      setTopProdutos([]);
      setMargemLucro(0);
      setTopClientes([]);
      setResumo(null);
      setDadosMensais([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatorioDespesas = async () => {
    try {
      setLoading(true);
      const data = await despesaService.getResumo(mes, ano);
      setResumoDespesas(data);
    } catch (error) {
      console.error('Erro ao carregar resumo de despesas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMesNome = (m: number) => {
    return new Date(2024, m - 1).toLocaleString('pt-BR', { month: 'long' });
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
      <div>
        <h1 className="title">Relatórios</h1>
        <p className="text-text-secondary mt-2">Análise de desempenho e finanças</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-purple-primary/30">
        <button
          onClick={() => setAbaSelecionada('vendas')}
          className={`px-4 py-3 font-medium transition relative ${
            abaSelecionada === 'vendas'
              ? 'text-purple-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={18} />
            Vendas
          </div>
          {abaSelecionada === 'vendas' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-primary to-purple-highlight rounded-t"></div>
          )}
        </button>

        <button
          onClick={() => setAbaSelecionada('despesas')}
          className={`px-4 py-3 font-medium transition relative ${
            abaSelecionada === 'despesas'
              ? 'text-purple-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <DollarSign size={18} />
            Despesas
          </div>
          {abaSelecionada === 'despesas' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-primary to-purple-highlight rounded-t"></div>
          )}
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {abaSelecionada === 'vendas' ? (
        <RelatorioVendas
          periodo={periodo}
          setPeriodo={setPeriodo}
          ticketMedio={ticketMedio}
          topProdutos={topProdutos}
          topClientes={topClientes}
          margemLucro={margemLucro}
          resumo={resumo}
          dadosMensais={dadosMensais}
        />
      ) : (
        <RelatorioDespesasContent
          mes={mes}
          setMes={setMes}
          ano={ano}
          setAno={setAno}
          resumoDespesas={resumoDespesas}
          getMesNome={getMesNome}
        />
      )}
    </div>
  );
}

// Componente de Relatório de Vendas
function RelatorioVendas({ periodo, setPeriodo, ticketMedio, topProdutos, topClientes, margemLucro, resumo, dadosMensais }: any) {
  console.log('📋 RelatorioVendas renderizando');
  console.log('📋 dadosMensais prop:', dadosMensais);
  console.log('📋 Tipo de dadosMensais:', typeof dadosMensais);
  console.log('📋 É array?:', Array.isArray(dadosMensais));
  console.log('📋 Comprimento:', dadosMensais?.length);
  return (
    <div className="space-y-6">
      {/* Período Selection */}
      <div className="flex justify-end">
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="input py-2 px-3 text-sm"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="15">Últimos 15 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="60">Últimos 60 dias</option>
          <option value="90">Últimos 90 dias</option>
        </select>
      </div>

      {/* Cards com métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div key="faturamento" className="card shadow-lg hover:shadow-xl hover:shadow-purple-primary/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Faturamento Total</span>
            <DollarSign className="text-purple-primary" size={20} />
          </div>
          <div className="text-3xl font-bold text-purple-primary">
            R$ {resumo?.faturamentoTotal?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">Receita bruta</p>
        </div>

        <div key="custos" className="card shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Custo dos Produtos</span>
            <Package className="text-orange-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-500">
            R$ {resumo?.custoTotal?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">Custo de aquisição</p>
        </div>

        <div key="despesas" className="card shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Despesas Totais</span>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-red-500">
            R$ {resumo?.despesasTotal?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">Custos operacionais</p>
        </div>

        <div key="ticket" className="card shadow-lg hover:shadow-xl hover:shadow-purple-primary/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Ticket Médio</span>
            <ShoppingCart className="text-purple-primary" size={20} />
          </div>
          <div className="text-3xl font-bold text-purple-primary">
            R$ {ticketMedio?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">Valor médio por comanda</p>
        </div>

        <div key="lucro" className="card shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Lucro Líquido</span>
            <Zap className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-500">
            R$ {resumo?.lucroLiquido?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">Faturamento - Custos - Despesas</p>
        </div>
      </div>

      {/* Cards com margens */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div key="margem-bruta" className="card shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Margem Bruta</span>
            <TrendingUp className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {resumo?.margemGrossa?.toFixed(1) || '0'}%
          </div>
          <p className="text-text-secondary text-xs mt-2">Sobre vendas (sem despesas)</p>
        </div>

        <div key="margem-liquida" className="card shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Margem Líquida</span>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-500">
            {resumo?.margemLiquida?.toFixed(1) || '0'}%
          </div>
          <p className="text-text-secondary text-xs mt-2">Sobre vendas (com despesas)</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GraficoFaturamentoVsDespesasVsLucro dados={dadosMensais} />
        <GraficoMargensBrutaVsLiquida dados={dadosMensais} />
      </div>

      {/* Top Clientes */}
      {topClientes && topClientes.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-purple-primary mb-4">Top Clientes</h2>
          <div className="space-y-3">
            {topClientes.slice(0, 5).map((cliente: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-bg-input/50 rounded">
                <div>
                  <p className="font-medium text-text-primary">{cliente.nomeCliente}</p>
                  <p className="text-sm text-text-secondary">{cliente.qtdComandas} comandas</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-primary">
                    R$ {cliente.totalGasto?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Produtos */}
      {topProdutos && topProdutos.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-purple-primary mb-4">Top Produtos</h2>
          <div className="space-y-3">
            {topProdutos.slice(0, 5).map((produto: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-bg-input/50 rounded">
                <div>
                  <p className="font-medium text-text-primary">{produto.nome}</p>
                  <p className="text-sm text-text-secondary">{produto.quantidadeVendida} unidades</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-purple-primary">
                    R$ {produto.faturamento?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente de Relatório de Despesas
function RelatorioDespesasContent({ mes, setMes, ano, setAno, resumoDespesas, getMesNome }: any) {
  return (
    <div className="space-y-6">
      {/* Período Selection */}
      <div className="flex gap-2 justify-end">
        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="input py-2 px-3 text-sm"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{getMesNome(m)}</option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => setAno(parseInt(e.target.value))}
          className="input py-2 px-3 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Cards com totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div key="total" className="card shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Despesas Totais</span>
            <DollarSign className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-red-500">
            R$ {(resumoDespesas?.total || 0).toFixed(2)}
          </div>
          <p className="text-text-secondary text-xs mt-2">{getMesNome(mes)} de {ano}</p>
        </div>

        <div key="fixed" className="card shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Despesas Fixas</span>
            <AlertCircle className="text-orange-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-500">
            R$ {(resumoDespesas?.fixa || 0).toFixed(2)}
          </div>
          <p className="text-text-secondary text-xs mt-2">Obrigatórias</p>
        </div>

        <div key="variable" className="card shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Despesas Variáveis</span>
            <BarChart3 className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-blue-500">
            R$ {(resumoDespesas?.variavel || 0).toFixed(2)}
          </div>
          <p className="text-text-secondary text-xs mt-2">Conforme necessário</p>
        </div>
      </div>

      {/* Categorias */}
      {resumoDespesas?.por_categoria && Object.keys(resumoDespesas.por_categoria).length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-purple-primary mb-4">Despesas por Categoria</h2>
          <div className="space-y-3">
            {Object.entries(resumoDespesas.por_categoria).map(([categoria, valor]: any) => (
              <div key={categoria} className="flex items-center justify-between p-3 bg-bg-input/50 rounded">
                <p className="font-medium text-text-primary">{categoria}</p>
                <p className="font-semibold text-red-500">R$ {valor.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
