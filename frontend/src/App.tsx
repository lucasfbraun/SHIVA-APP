import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import ProdutoForm from './pages/ProdutoForm';
import Comandas from './pages/Comandas';
import ComandaDetalhes from './pages/ComandaDetalhes';
import Relatorios from './pages/Relatorios';
import OCRCupom from './pages/OCRCupom';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="produtos/novo" element={<ProdutoForm />} />
        <Route path="produtos/editar/:id" element={<ProdutoForm />} />
        <Route path="comandas" element={<Comandas />} />
        <Route path="comandas/:id" element={<ComandaDetalhes />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="ocr" element={<OCRCupom />} />
      </Route>
    </Routes>
  );
}

export default App;
