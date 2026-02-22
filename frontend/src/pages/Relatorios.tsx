import { useEffect, useState, useRef } from 'react';
import { TrendingUp, DollarSign, Package, BarChart3, TrendingDown, ShoppingCart, AlertCircle, Zap, Calendar, FileText, Filter, Search, X, ArrowDownCircle, ArrowUpCircle, Download } from 'lucide-react';
import { relatorioService } from '@/services/relatorioService';
import { despesaService } from '@/services/despesaService';
import { estoqueService, EntradaEstoque } from '@/services/estoqueService';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';
import { GraficoFaturamentoVsDespesasVsLucro, GraficoMargensBrutaVsLiquida } from '@/components/GraficosRelatorio';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';

export default function Relatorios() {
  const [abaSelecionada, setAbaSelecionada] = useState<'vendas' | 'despesas' | 'estoque'>('vendas');
  const [loading, setLoading] = useState(true);
  
  // Vendas
  const [mesVendas, setMesVendas] = useState(new Date().getMonth() + 1);
  const [anoVendas, setAnoVendas] = useState(new Date().getFullYear());
  const [todosMesesVendas, setTodosMesesVendas] = useState(false);
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

  // Estoque
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'MANUAL' | 'OCR'>('TODOS');
  const [filtroMovimento, setFiltroMovimento] = useState<'TODOS' | 'ENTRADA' | 'SAIDA'>('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [produtoId, setProdutoId] = useState('');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  useEffect(() => {
    loadProdutos();
  }, []);

  useEffect(() => {
    if (abaSelecionada === 'vendas') {
      loadRelatorioVendas();
    } else if (abaSelecionada === 'despesas') {
      loadRelatorioDespesas();
    } else if (abaSelecionada === 'estoque') {
      loadRelatorioEstoque();
    }
  }, [abaSelecionada, mesVendas, anoVendas, todosMesesVendas, mes, ano, filtroTipo, filtroMovimento, dataInicio, dataFim, produtoId]);

  const loadProdutos = async () => {
    try {
      const data = await produtoService.getAll();
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  const loadRelatorioVendas = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando loadRelatorioVendas...');
      
      // Definir início e fim do período
      let dataInicio: Date;
      let dataFim: Date;
      
      if (todosMesesVendas) {
        // Todos os meses do ano
        dataInicio = new Date(anoVendas, 0, 1);
        dataFim = new Date(anoVendas, 11, 31);
      } else {
        // Mês específico
        dataInicio = new Date(anoVendas, mesVendas - 1, 1);
        dataFim = new Date(anoVendas, mesVendas, 0);
      }
      
      dataInicio.setHours(0, 0, 0, 0);
      dataFim.setHours(23, 59, 59, 999);

      console.log('Mês/Ano selecionado:', mesVendas, anoVendas);
      console.log('Data início:', dataInicio.toISOString());
      console.log('Data fim:', dataFim.toISOString());

      const [ticketData, produtosData, margemData, clientesData, resumoData, dadosMensaisData] = await Promise.all([
        relatorioService.getTicketMedio(dataInicio.toISOString(), dataFim.toISOString()),
        relatorioService.getProdutosMaisVendidos(5, dataInicio.toISOString(), dataFim.toISOString()),
        relatorioService.getMargemLucro(dataInicio.toISOString(), dataFim.toISOString()),
        relatorioService.getTopClientes(10, dataInicio.toISOString(), dataFim.toISOString()),
        relatorioService.getResumo(dataInicio.toISOString(), dataFim.toISOString()),
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

  const loadRelatorioEstoque = async () => {
    try {
      setLoading(true);
      const filtros: any = {};
      
      if (filtroTipo !== 'TODOS') {
        filtros.tipoEntrada = filtroTipo;
      }

      if (filtroMovimento !== 'TODOS') {
        filtros.tipoMovimento = filtroMovimento;
      }
      
      if (dataInicio) {
        filtros.dataInicio = dataInicio;
      }
      
      if (dataFim) {
        filtros.dataFim = dataFim;
      }
      
      if (produtoId) {
        filtros.produtoId = produtoId;
      }
      
      const data = await estoqueService.getEntradas(filtros);
      setEntradas(data);
    } catch (error) {
      console.error('Erro ao buscar entradas:', error);
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

        <button
          onClick={() => setAbaSelecionada('estoque')}
          className={`px-4 py-3 font-medium transition relative ${
            abaSelecionada === 'estoque'
              ? 'text-purple-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package size={18} />
            Movimento Estoque
          </div>
          {abaSelecionada === 'estoque' && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-primary to-purple-highlight rounded-t"></div>
          )}
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {abaSelecionada === 'vendas' ? (
        <RelatorioVendas
          mesVendas={mesVendas}
          setMesVendas={setMesVendas}
          anoVendas={anoVendas}
          setAnoVendas={setAnoVendas}
          todosMesesVendas={todosMesesVendas}
          setTodosMesesVendas={setTodosMesesVendas}
          ticketMedio={ticketMedio}
          topProdutos={topProdutos}
          topClientes={topClientes}
          margemLucro={margemLucro}
          resumo={resumo}
          dadosMensais={dadosMensais}
          getMesNome={getMesNome}
        />
      ) : abaSelecionada === 'despesas' ? (
        <RelatorioDespesasContent
          mes={mes}
          setMes={setMes}
          ano={ano}
          setAno={setAno}
          resumoDespesas={resumoDespesas}
          getMesNome={getMesNome}
        />
      ) : (
        <RelatorioEstoqueContent
          entradas={entradas}
          filtroTipo={filtroTipo}
          setFiltroTipo={setFiltroTipo}
          filtroMovimento={filtroMovimento}
          setFiltroMovimento={setFiltroMovimento}
          dataInicio={dataInicio}
          setDataInicio={setDataInicio}
          dataFim={dataFim}
          setDataFim={setDataFim}
          produtoId={produtoId}
          setProdutoId={setProdutoId}
          produtos={produtos}
          buscaProduto={buscaProduto}
          setBuscaProduto={setBuscaProduto}
          produtoSelecionado={produtoSelecionado}
          setProdutoSelecionado={setProdutoSelecionado}
          mostrarSugestoes={mostrarSugestoes}
          setMostrarSugestoes={setMostrarSugestoes}
        />
      )}
    </div>
  );
}

// Componente de Relatório de Vendas
function RelatorioVendas({ mesVendas, setMesVendas, anoVendas, setAnoVendas, todosMesesVendas, setTodosMesesVendas, ticketMedio, topProdutos, topClientes, margemLucro, resumo, dadosMensais, getMesNome }: any) {
  console.log('📋 RelatorioVendas renderizando');
  console.log('📋 dadosMensais prop:', dadosMensais);
  console.log('📋 Tipo de dadosMensais:', typeof dadosMensais);
  console.log('📋 É array?:', Array.isArray(dadosMensais));
  console.log('📋 Comprimento:', dadosMensais?.length);
  
  const getPeriodoTexto = () => {
    if (todosMesesVendas) {
      return `Todos os Meses de ${anoVendas}`;
    }
    return `${getMesNome(mesVendas)} de ${anoVendas}`;
  };
  return (
    <div className="space-y-6">
      {/* Filtros de Mês e Ano */}
      <div className="flex gap-2 justify-end items-center flex-wrap">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="todosMeses"
            checked={todosMesesVendas}
            onChange={(e) => setTodosMesesVendas(e.target.checked)}
            className="cursor-pointer w-4 h-4 rounded"
          />
          <label htmlFor="todosMeses" className="text-sm text-text-primary cursor-pointer">
            Todos os Meses
          </label>
        </div>
        <select
          value={mesVendas}
          onChange={(e) => setMesVendas(parseInt(e.target.value))}
          className="input py-2 px-3 text-sm"
          disabled={todosMesesVendas}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{getMesNome(m)}</option>
          ))}
        </select>
        <select
          value={anoVendas}
          onChange={(e) => setAnoVendas(parseInt(e.target.value))}
          className="input py-2 px-3 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
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
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
        </div>

        <div key="custos" className="card shadow-lg hover:shadow-xl hover:shadow-orange-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Custo dos Produtos</span>
            <Package className="text-orange-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-orange-500">
            R$ {resumo?.custoTotal?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
        </div>

        <div key="despesas" className="card shadow-lg hover:shadow-xl hover:shadow-red-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Despesas Totais</span>
            <TrendingDown className="text-red-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-red-500">
            R$ {resumo?.despesasTotal?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
        </div>

        <div key="ticket" className="card shadow-lg hover:shadow-xl hover:shadow-purple-primary/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Ticket Médio</span>
            <ShoppingCart className="text-purple-primary" size={20} />
          </div>
          <div className="text-3xl font-bold text-purple-primary">
            R$ {ticketMedio?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
        </div>

        <div key="lucro" className="card shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Lucro Líquido</span>
            <Zap className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-500">
            R$ {resumo?.lucroLiquido?.toFixed(2) || '0.00'}
          </div>
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
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
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
          <p className="text-text-secondary text-xs mt-1">Sobre vendas (sem despesas)</p>
        </div>

        <div key="margem-liquida" className="card shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Margem Líquida</span>
            <TrendingUp className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-500">
            {resumo?.margemLiquida?.toFixed(1) || '0'}%
          </div>
          <p className="text-text-secondary text-xs mt-2">{getPeriodoTexto()}</p>
          <p className="text-text-secondary text-xs mt-1">Sobre vendas (com despesas)</p>
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

// Componente de Relatório de Estoque
function RelatorioEstoqueContent({ entradas, filtroTipo, setFiltroTipo, filtroMovimento, setFiltroMovimento, dataInicio, setDataInicio, dataFim, setDataFim, produtoId, setProdutoId, produtos, buscaProduto, setBuscaProduto, produtoSelecionado, setProdutoSelecionado, mostrarSugestoes, setMostrarSugestoes }: any) {
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setMostrarSugestoes(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const entradasManuais = entradas.filter((e: EntradaEstoque) => e.tipoEntrada === 'MANUAL');
  const entradasOCR = entradas.filter((e: EntradaEstoque) => e.tipoEntrada === 'OCR');
  
  const totalQuantidade = entradas.reduce((acc: number, e: EntradaEstoque) => acc + e.quantidade, 0);
  const totalValor = entradas.reduce((acc: number, e: EntradaEstoque) => acc + (e.quantidade * e.custoUnitario), 0);

  const limparFiltros = () => {
    setFiltroTipo('TODOS');
    setFiltroMovimento('TODOS');
    setDataInicio('');
    setDataFim('');
    setProdutoId('');
    setBuscaProduto('');
    setProdutoSelecionado(null);
  };

  const produtosFiltrados = produtos.filter((p: Produto) => 
    p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
  ).slice(0, 10);

  const handleSelecionarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setProdutoId(produto.id);
    setBuscaProduto('');
    setMostrarSugestoes(false);
  };

  const handleRemoverProduto = () => {
    setProdutoSelecionado(null);
    setProdutoId('');
    setBuscaProduto('');
  };

  const exportarParaExcel = () => {
    if (entradas.length === 0) {
      alert('Nenhum dado para exportar');
      return;
    }

    // Preparar dados para Excel
    const dados = entradas.map((entrada) => ({
      'Data': format(new Date(entrada.dataEntrada), 'dd/MM/yyyy', { locale: ptBR }),
      'Produto': entrada.produto.nome,
      'Código Interno': entrada.produto.codigoInterno || '-',
      'Categoria': entrada.produto.categoria || '-',
      'Quantidade': entrada.quantidade,
      'Custo Unitário': parseFloat(entrada.custoUnitario.toFixed(2)),
      'Total': parseFloat((entrada.quantidade * entrada.custoUnitario).toFixed(2)),
      'Movimento': entrada.tipoMovimento === 'ENTRADA' ? 'Entrada' : 'Saída',
      'Tipo': entrada.tipoEntrada === 'MANUAL' ? 'Manual' : 'OCR',
      'Nº Cupom': entrada.numeroCupom || '-',
      'Observação': entrada.observacao || '-'
    }));

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(dados);
    
    // Adicionar formatação às colunas
    ws['!cols'] = [
      { wch: 12 }, // Data
      { wch: 20 }, // Produto
      { wch: 15 }, // Código Interno
      { wch: 15 }, // Categoria
      { wch: 12 }, // Quantidade
      { wch: 15 }, // Custo Unitário
      { wch: 15 }, // Total
      { wch: 12 }, // Movimento
      { wch: 10 }, // Tipo
      { wch: 12 }, // Nº Cupom
      { wch: 20 }  // Observação
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimentações');

    // Baixar arquivo
    const nomeArquivo = `Movimentacoes_Estoque_${format(new Date(), 'dd_MM_yyyy_HHmmss')}.xlsx`;
    XLSX.writeFile(wb, nomeArquivo);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-purple-primary" />
          <h2 className="font-semibold text-text-primary">Filtros</h2>
        </div>

        <div className="space-y-16">
          {/* Primeira linha - Busca de Produto */}
          <div ref={searchRef} className="pb-8">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Produto
            </label>
            {produtoSelecionado ? (
              <div className="flex items-center gap-2 bg-purple-primary/10 border border-purple-primary/30 rounded-lg px-3 py-2.5">
                <Package size={16} className="text-purple-primary" />
                <span className="flex-1 text-sm text-text-primary">{produtoSelecionado.nome}</span>
                <button
                  onClick={handleRemoverProduto}
                  className="text-text-secondary hover:text-red-500 transition"
                  title="Remover filtro"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={16} />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={buscaProduto}
                  onChange={(e) => {
                    setBuscaProduto(e.target.value);
                    setMostrarSugestoes(true);
                  }}
                  onFocus={() => setMostrarSugestoes(true)}
                  className="input py-2 px-3 pl-9 text-sm w-full"
                />
                {mostrarSugestoes && buscaProduto && produtosFiltrados.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-surface-secondary border border-purple-primary/30 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {produtosFiltrados.map((produto: Produto) => (
                      <button
                        key={produto.id}
                        onClick={() => handleSelecionarProduto(produto)}
                        className="w-full text-left px-3 py-2 hover:bg-purple-primary/10 transition flex items-center gap-2 border-b border-purple-primary/10 last:border-b-0"
                      >
                        <Package size={14} className="text-purple-primary" />
                        <div>
                          <div className="text-sm text-text-primary font-medium">{produto.nome}</div>
                          {produto.categoria && (
                            <div className="text-xs text-text-secondary">{produto.categoria}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {mostrarSugestoes && buscaProduto && produtosFiltrados.length === 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-surface-secondary border border-purple-primary/30 rounded-lg shadow-xl p-3">
                    <p className="text-sm text-text-secondary">Nenhum produto encontrado</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Segunda linha - Outros filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Tipo de Entrada */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tipo de Entrada
            </label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as any)}
              className="input py-2 px-3 text-sm w-full"
            >
              <option value="TODOS">Todos</option>
              <option value="MANUAL">Movimento Manual</option>
              <option value="OCR">OCR Cupom</option>
            </select>
          </div>

          {/* Tipo de Movimento */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tipo de Movimento
            </label>
            <select
              value={filtroMovimento}
              onChange={(e) => setFiltroMovimento(e.target.value as any)}
              className="input py-2 px-3 text-sm w-full"
            >
              <option value="TODOS">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>

          {/* Data Início */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="input py-2 px-3 text-sm w-full"
            />
          </div>

          {/* Data Fim */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="input py-2 px-3 text-sm w-full"
            />
          </div>

          {/* Botão Limpar */}
          <div className="flex items-end">
            <button
              onClick={limparFiltros}
              className="btn-secondary w-full"
            >
              Limpar Filtros
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Total de Entradas</span>
            <TrendingUp className="text-purple-primary" size={20} />
          </div>
          <div className="text-3xl font-bold text-text-primary">{entradas.length}</div>
        </div>

        <div className="card shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Movimento Manual</span>
            <Package className="text-blue-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-blue-500">{entradasManuais.length}</div>
        </div>

        <div className="card shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Via OCR Cupom</span>
            <FileText className="text-green-500" size={20} />
          </div>
          <div className="text-3xl font-bold text-green-500">{entradasOCR.length}</div>
        </div>

        <div className="card shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-text-secondary text-sm">Valor Total</span>
            <DollarSign className="text-purple-primary" size={20} />
          </div>
          <div className="text-2xl font-bold text-purple-primary">R$ {totalValor.toFixed(2)}</div>
        </div>
      </div>

      {/* Tabela de Entradas */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-text-primary">
            Histórico de Entradas ({entradas.length})
          </h2>
          <button
            onClick={exportarParaExcel}
            disabled={entradas.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Exportar dados para Excel"
          >
            <Download size={16} />
            Exportar Excel
          </button>
        </div>

        {entradas.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            Nenhuma entrada encontrada
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-primary/30">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Data</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Produto</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Qtd</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Custo Unit.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Movimento</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Tipo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Nº Cupom</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-secondary">Observação</th>
                </tr>
              </thead>
              <tbody>
                {entradas.map((entrada: EntradaEstoque) => (
                  <tr key={entrada.id} className="border-b border-purple-primary/10 hover:bg-purple-primary/5">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-text-secondary" />
                        <span className="text-sm text-text-primary">
                          {format(new Date(entrada.dataEntrada), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium text-text-primary">{entrada.produto.nome}</div>
                        {entrada.produto.codigoInterno && (
                          <div className="text-xs text-text-secondary">Cód: {entrada.produto.codigoInterno}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-text-primary">{entrada.quantidade}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-text-primary">R$ {entrada.custoUnitario.toFixed(2)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-text-primary">
                        R$ {(entrada.quantidade * entrada.custoUnitario).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {entrada.tipoMovimento === 'ENTRADA' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-action/10 text-green-action">
                          <ArrowDownCircle size={12} className="mr-1" />
                          Entrada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-action/10 text-red-action">
                          <ArrowUpCircle size={12} className="mr-1" />
                          Saída
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">{entrada.tipoEntrada === 'MANUAL' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                          <Package size={12} className="mr-1" />
                          Manual
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
                          <FileText size={12} className="mr-1" />
                          OCR
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-text-secondary">
                        {entrada.numeroCupom || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-text-secondary truncate max-w-xs block">
                        {entrada.observacao || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
