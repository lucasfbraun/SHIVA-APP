import { useState, useRef } from 'react';
import { Camera, Upload, CheckCircle } from 'lucide-react';

export default function OCRCupom() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<any>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResultado(null);
    }
  };

  const handleProcessar = async () => {
    if (!imageFile) {
      alert('Selecione uma imagem do cupom fiscal');
      return;
    }

    try {
      setProcessando(true);

      const formData = new FormData();
      formData.append('cupom', imageFile);

      const response = await fetch('/api/ocr/processar-cupom', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar cupom');
      }

      setResultado(data);
    } catch (error: any) {
      console.error('Erro ao processar cupom:', error);
      alert(error.message || 'Erro ao processar cupom');
    } finally {
      setProcessando(false);
    }
  };

  const handleConfirmarEntrada = async () => {
    if (!resultado || !resultado.itensDetectados) return;

    alert('Funcionalidade de confirmação será implementada na próxima versão. Por enquanto, cadastre os produtos manualmente e use a entrada de estoque.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="title">OCR de Cupom Fiscal</h1>
        <p className="text-text-secondary mt-2">
          Faça upload de um cupom fiscal para identificar produtos automaticamente (MODO SIMULAÇÃO)
        </p>
      </div>

      {/* Aviso */}
      <div className="card bg-purple-primary/10 border-purple-primary">
        <p className="text-text-primary">
          <strong>📸 Modo Simulação:</strong> O sistema está configurado para simular a leitura de cupons.
          Na versão final, será integrado com OCR real (Tesseract).
        </p>
      </div>

      {/* Upload */}
      <div className="card">
        <h2 className="text-lg font-semibold text-text-primary mb-4">1. Selecione o Cupom</h2>
        
        <div className="flex flex-col items-center space-y-4">
          {/* Preview */}
          <div className="w-full aspect-[3/4] max-w-md rounded-xl bg-background-primary overflow-hidden">
            {previewImage ? (
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                <Camera size={64} />
                <p className="mt-4">Nenhuma imagem selecionada</p>
              </div>
            )}
          </div>

          {/* Botões */}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center space-x-2"
            >
              <Camera size={20} />
              <span>Tirar Foto</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center space-x-2"
            >
              <Upload size={20} />
              <span>Selecionar Arquivo</span>
            </button>
          </div>

          {imageFile && !resultado && (
            <button
              onClick={handleProcessar}
              disabled={processando}
              className="btn-primary w-full max-w-md disabled:opacity-50"
            >
              {processando ? 'Processando...' : 'Processar Cupom'}
            </button>
          )}
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">2. Itens Detectados</h2>
            <CheckCircle className="text-green-400" size={24} />
          </div>

          <div className="space-y-3 mb-6">
            {resultado.itensDetectados.map((item: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-background-primary rounded-lg flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-text-primary">{item.nome}</p>
                  <p className="text-sm text-text-secondary">
                    Quantidade: {item.quantidade} | Custo: R$ {item.precoUnitario.toFixed(2)}
                  </p>
                </div>
                <p className="font-semibold text-purple-highlight">
                  R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-purple-primary/10 border border-purple-primary/30 rounded-lg p-4 mb-4">
            <p className="text-text-primary text-sm">
              <strong>⚠️ Próximos passos:</strong> Na versão final, você poderá confirmar estes itens
              e dar entrada automática no estoque. Por enquanto, cadastre os produtos manualmente
              e use a funcionalidade de entrada de estoque.
            </p>
          </div>

          <button
            onClick={() => {
              setPreviewImage(null);
              setImageFile(null);
              setResultado(null);
            }}
            className="btn-secondary w-full"
          >
            Processar Novo Cupom
          </button>
        </div>
      )}
    </div>
  );
}
