import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Calculator, Trash2 } from 'lucide-react';
import { produtoService } from '@/services/produtoService';
import { Produto } from '@/types';
import EngenhariaModal from '@/components/EngenhariaModal';

export default function ProdutoForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProduto, setLoadingProduto] = useState(!!id);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [engenhariaModalAberto, setEngenhariaModalAberto] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: '',
    codigoInterno: '',
    codigoBarras: '',
    custoMedio: '',
    precoVenda: '',
    markup: '100',
    tipo: 'COMPRADO',
    controlaEstoque: true,
    ativo: true,
  });

  useEffect(() => {
    if (id) {
      loadProduto();
    }
  }, [id]);

  const loadProduto = async () => {
    try {
      setLoadingProduto(true);
      const produto = await produtoService.getById(id!);
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao || '',
        categoria: produto.categoria || '',
        codigoInterno: produto.codigoInterno || '',
        codigoBarras: produto.codigoBarras || '',
        custoMedio: produto.custoMedio.toString(),
        precoVenda: produto.precoVenda.toString(),
        markup: produto.markup?.toString() || '100',
        tipo: produto.tipo || 'COMPRADO',
        controlaEstoque: produto.controlaEstoque !== undefined ? produto.controlaEstoque : true,
        ativo: produto.ativo !== undefined ? produto.ativo : true,
      });
      if (produto.imagemUrl) {
        setPreviewImage(produto.imagemUrl);
      }
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto');
      navigate('/produtos');
    } finally {
      setLoadingProduto(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageRemoved(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewImage(null);
    setImageFile(null);
    setImageRemoved(true);
  };

  const calcularPrecoSugerido = async () => {
    if (!formData.custoMedio || !formData.markup) {
      return;
    }

    try {
      const { precoSugerido } = await produtoService.calcularPreco(
        parseFloat(formData.custoMedio),
        parseFloat(formData.markup)
      );
      setFormData(prev => ({ ...prev, precoVenda: precoSugerido }));
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
    }
  };

  const handleEngenhariaAtualizada = (novosCusto: number) => {
    setFormData(prev => ({ ...prev, custoMedio: novosCusto.toString() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.precoVenda) {
      alert('Nome e preço de venda são obrigatórios');
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append('nome', formData.nome);
      data.append('descricao', formData.descricao);
      data.append('categoria', formData.categoria);
      data.append('codigoInterno', formData.codigoInterno);
      data.append('codigoBarras', formData.codigoBarras);
      data.append('custoMedio', formData.custoMedio || '0');
      data.append('precoVenda', formData.precoVenda);
      data.append('markup', formData.markup || '0');
      data.append('tipo', formData.tipo);
      data.append('controlaEstoque', String(formData.controlaEstoque));
      data.append('ativo', String(formData.ativo));
      
      if (imageRemoved) {
        data.append('removerImagem', 'true');
      }

      if (imageFile) {
        data.append('imagem', imageFile);
      }

      if (id) {
        await produtoService.update(id, data);
      } else {
        await produtoService.create(data);
      }

      navigate('/produtos');
    } catch (error: any) {
      console.error('Erro ao salvar produto:', error);
      alert(error.response?.data?.error || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduto) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/produtos')}
          className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
        >
          <ArrowLeft className="text-text-primary" size={24} />
        </button>
        <div>
          <h1 className="title">{id ? 'Editar Produto' : 'Novo Produto'}</h1>
          <p className="text-text-secondary mt-2">
            {id ? 'Atualize as informações do produto' : 'Cadastre um novo produto'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Imagem */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Imagem do Produto</h2>
          
          <div className="flex flex-col items-center space-y-4">
            {/* Preview */}
            <div className="w-full aspect-square max-w-sm rounded-xl bg-background-primary overflow-hidden">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="text-text-secondary" size={64} />
                </div>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="btn-secondary flex items-center space-x-2"
              >
                <Camera size={20} />
                <span>Tirar Foto</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary flex items-center space-x-2"
              >
                <Upload size={20} />
                <span>Selecionar Imagem</span>
              </button>
              {previewImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Trash2 size={20} />
                  <span>Remover Imagem</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Informações Básicas */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Informações Básicas</h2>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Nome do Produto *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="input w-full"
              placeholder="Ex: Coca-Cola 2L"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="input w-full min-h-[100px]"
              placeholder="Descrição do produto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Categoria
              </label>
              <input
                type="text"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="input w-full"
                placeholder="Ex: Bebidas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Código Interno
              </label>
              <input
                type="text"
                value={formData.codigoInterno}
                onChange={(e) => setFormData({ ...formData, codigoInterno: e.target.value })}
                className="input w-full"
                placeholder="Ex: COCA2L"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Código de Barras (EAN)
            </label>
            <input
              type="text"
              value={formData.codigoBarras}
              onChange={(e) => setFormData({ ...formData, codigoBarras: e.target.value })}
              className="input w-full"
              placeholder="Ex: 7894900011517"
            />
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.controlaEstoque}
                onChange={(e) => setFormData({ ...formData, controlaEstoque: e.target.checked })}
                className="w-5 h-5 rounded border-purple-primary/30 bg-background-primary text-purple-primary focus:ring-purple-primary focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-text-primary block">Controla Estoque</span>
                <span className="text-xs text-text-secondary">Quando ativo, o produto aparecerá na tela de Movimento de Estoque</span>
              </div>
            </label>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.ativo}
                onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                className="w-5 h-5 rounded border-purple-primary/30 bg-background-primary text-purple-primary focus:ring-purple-primary focus:ring-2"
              />
              <div>
                <span className="text-sm font-medium text-text-primary block">Produto Ativo</span>
                <span className="text-xs text-text-secondary">Produtos inativos não aparecem na venda mas continuam no sistema</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Tipo de Produto
            </label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="input w-full"
            >
              <option value="COMPRADO">Comprado</option>
              <option value="FABRICADO">Fabricado</option>
            </select>
          </div>

          {formData.tipo === 'FABRICADO' && id && (
            <div>
              <button
                type="button"
                onClick={() => setEngenhariaModalAberto(true)}
                className="btn-primary w-full"
              >
                Formar Engenharia
              </button>
            </div>
          )}
        </div>

        {/* Preços e Markup */}
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Preços e Margem</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Custo Médio (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.custoMedio}
                onChange={(e) => setFormData({ ...formData, custoMedio: e.target.value })}
                className="input w-full"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Markup (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.markup}
                onChange={(e) => setFormData({ ...formData, markup: e.target.value })}
                className="input w-full"
                placeholder="100"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={calcularPrecoSugerido}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            <Calculator size={20} />
            <span>Calcular Preço Sugerido</span>
          </button>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Preço de Venda (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.precoVenda}
              onChange={(e) => setFormData({ ...formData, precoVenda: e.target.value })}
              className="input w-full"
              placeholder="0.00"
              required
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/produtos')}
            className="btn-secondary flex-1"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : id ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>

      {engenhariaModalAberto && id && (
        <EngenhariaModal
          produtoId={id}
          produtoNome={formData.nome}
          custoMedio={parseFloat(formData.custoMedio) || 0}
          onClose={() => setEngenhariaModalAberto(false)}
          onSave={handleEngenhariaAtualizada}
        />
      )}
    </div>
  );
}
