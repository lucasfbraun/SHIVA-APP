import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/produtos';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'produto-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens são permitidas'));
  }
});

// GET - Listar todos os produtos
router.get('/', async (req: Request, res: Response) => {
  try {
    const { ativo, categoria, controlaEstoque } = req.query;
    
    const produtos = await prisma.produto.findMany({
      where: {
        ...(ativo !== undefined && { ativo: ativo === 'true' }),
        ...(categoria && { categoria: String(categoria) }),
        ...(controlaEstoque !== undefined && { controlaEstoque: controlaEstoque === 'true' })
      },
      include: { estoque: true },
      orderBy: { nome: 'asc' }
    });
    
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// GET - Buscar produto por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: { 
        estoque: true,
        entradasEstoque: {
          orderBy: { criadoEm: 'desc' },
          take: 10
        }
      }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    res.json(produto);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// POST - Criar produto
router.post('/', upload.single('imagem'), async (req: Request, res: Response) => {
  try {
    const { nome, descricao, categoria, codigoInterno, codigoBarras, custoMedio, precoVenda, markup, controlaEstoque } = req.body;
    
    // Validações
    if (!nome || !precoVenda) {
      return res.status(400).json({ error: 'Nome e preço de venda são obrigatórios' });
    }
    
    const imagemUrl = req.file ? `/uploads/produtos/${req.file.filename}` : null;
    
    // Calcular preço sugerido se markup existir
    let precoFinal = parseFloat(precoVenda);
    if (markup && custoMedio) {
      const precoSugerido = parseFloat(custoMedio) * (1 + parseFloat(markup) / 100);
      // Usa o preço sugerido se não foi fornecido preço de venda diferente
      if (!precoVenda || precoVenda === '0') {
        precoFinal = precoSugerido;
      }
    }
    
    const produto = await prisma.produto.create({
      data: {
        nome,
        descricao,
        categoria,
        codigoInterno,
        codigoBarras,
        custoMedio: custoMedio ? parseFloat(custoMedio) : 0,
        precoVenda: precoFinal,
        markup: markup ? parseFloat(markup) : 0,
        controlaEstoque: controlaEstoque === 'true' || controlaEstoque === true,
        imagemUrl,
        estoque: {
          create: {
            quantidade: 0
          }
        }
      },
      include: { estoque: true }
    });
    
    res.status(201).json(produto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao criar produto' });
  }
});

// PUT - Atualizar produto
router.put('/:id', upload.single('imagem'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, categoria, codigoInterno, codigoBarras, custoMedio, precoVenda, markup, ativo, controlaEstoque } = req.body;
    
    const produtoExistente = await prisma.produto.findUnique({ where: { id } });
    if (!produtoExistente) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const imagemUrl = req.file ? `/uploads/produtos/${req.file.filename}` : produtoExistente.imagemUrl;
    
    // Se mudar imagem, deletar a antiga
    if (req.file && produtoExistente.imagemUrl) {
      const caminhoAntigo = path.join(process.cwd(), produtoExistente.imagemUrl);
      if (fs.existsSync(caminhoAntigo)) {
        fs.unlinkSync(caminhoAntigo);
      }
    }
    
    const produto = await prisma.produto.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(categoria !== undefined && { categoria }),
        ...(codigoInterno !== undefined && { codigoInterno }),
        ...(codigoBarras !== undefined && { codigoBarras }),
        ...(custoMedio !== undefined && { custoMedio: parseFloat(custoMedio) }),
        ...(precoVenda !== undefined && { precoVenda: parseFloat(precoVenda) }),
        ...(markup !== undefined && { markup: parseFloat(markup) }),
        ...(ativo !== undefined && { ativo: ativo === 'true' }),
        ...(controlaEstoque !== undefined && { controlaEstoque: controlaEstoque === 'true' || controlaEstoque === true }),
        ...(imagemUrl && { imagemUrl })
      },
      include: { estoque: true }
    });
    
    res.json(produto);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao atualizar produto' });
  }
});

// DELETE - Deletar produto (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const produto = await prisma.produto.update({
      where: { id },
      data: { ativo: false }
    });
    
    res.json({ message: 'Produto desativado com sucesso', produto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// POST - Calcular preço sugerido
router.post('/calcular-preco', async (req: Request, res: Response) => {
  try {
    const { custoMedio, markup } = req.body;
    
    if (!custoMedio || !markup) {
      return res.status(400).json({ error: 'Custo médio e markup são obrigatórios' });
    }
    
    const precoSugerido = parseFloat(custoMedio) * (1 + parseFloat(markup) / 100);
    
    res.json({ precoSugerido: precoSugerido.toFixed(2) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao calcular preço' });
  }
});

export default router;
