import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import ProdutoForm from './pages/ProdutoForm';
import Comandas from './pages/Comandas';
import ComandaDetalhes from './pages/ComandaDetalhes';
import Relatorios from './pages/Relatorios';
import OCRCupom from './pages/OCRCupom';
import Despesas from './pages/Despesas';
import RelatorioDespesas from './pages/RelatorioDespesas';

function App() {
  return (
    <Routes>
      {/* Rota pública de login */}
      <Route path="/login" element={<Login />} />

      {/* Rotas protegidas */}
      <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="produtos/novo" element={<ProdutoForm />} />
        <Route path="produtos/editar/:id" element={<ProdutoForm />} />
        <Route path="comandas" element={<Comandas />} />
        <Route path="comandas/:id" element={<ComandaDetalhes />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="relatoriodespesas" element={<RelatorioDespesas />} />
        <Route path="despesas" element={<Despesas />} />
        <Route path="ocr" element={<OCRCupom />} />
      </Route>
    </Routes>
  );
}

export default App;
