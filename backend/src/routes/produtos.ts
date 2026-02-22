import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

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
    const { nome, descricao, categoria, codigoInterno, codigoBarras, custoMedio, precoVenda, markup, controlaEstoque, ativo, tipo } = req.body;
    
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
        tipo: tipo || 'COMPRADO',
        controlaEstoque: controlaEstoque === 'true' || controlaEstoque === true,
        ativo: ativo !== undefined ? (ativo === 'true' || ativo === true) : true,
        imagemUrl,
        estoque: {
          create: {
            quantidade: 0
          }
        }
      } as any,
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
    const { nome, descricao, categoria, codigoInterno, codigoBarras, custoMedio, precoVenda, markup, ativo, controlaEstoque, tipo } = req.body;
    
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
        ...(tipo && { tipo }),
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

// GET - Verificar se produto pode ser deletado
router.get('/:id/pode-deletar', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar se produto existe
    const produto = await prisma.produto.findUnique({
      where: { id },
      include: {
        entradasEstoque: true,
        itensComanda: true
      }
    });
    
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const temEntradas = produto.entradasEstoque.length > 0;
    const temVendas = produto.itensComanda.length > 0;
    
    const podeDeletar = !temEntradas && !temVendas;
    
    res.json({
      podeDeletar,
      motivos: {
        temEntradas,
        temVendas,
        quantidadeEntradas: produto.entradasEstoque.length,
        quantidadeVendas: produto.itensComanda.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar produto' });
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

// PATCH - Alternar status ativo/inativo
router.patch('/:id/toggle-status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Buscar produto atual
    const produtoAtual = await prisma.produto.findUnique({
      where: { id }
    });
    
    if (!produtoAtual) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Alternar status
    const produto = await prisma.produto.update({
      where: { id },
      data: { ativo: !produtoAtual.ativo },
      include: { estoque: true }
    });
    
    res.json({ 
      message: produto.ativo ? 'Produto ativado com sucesso' : 'Produto desativado com sucesso',
      produto 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar status do produto' });
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

// GET - Exportar produtos para Excel
router.get('/exportar/excel', async (req: Request, res: Response) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: { estoque: true },
      orderBy: { nome: 'asc' }
    });

    // Preparar dados para o Excel
    const dadosExcel = produtos.map((p: any) => ({
      'Código': p.id,
      'Nome': p.nome,
      'Categoria': p.categoria || '',
      'Código de Barras': p.codigoBarras || '',
      'Custo Médio': p.custoMedio ? parseFloat(p.custoMedio.toString()).toFixed(2) : '0.00',
      'Preço Venda': p.precoVenda ? parseFloat(p.precoVenda.toString()).toFixed(2) : '0.00',
      'Markup': p.markup ? parseFloat(p.markup.toString()).toFixed(2) : '0.00',
      'Estoque Atual': p.estoque?.quantidade || 0,
      'Controla Estoque': p.controlaEstoque ? 'Sim' : 'Não',
      'Status': p.ativo ? 'Ativo' : 'Inativo'
    }));

    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosExcel);

    // Ajustar largura das colunas
    const colWidths = [
      { wch: 36 },  // Código
      { wch: 30 },  // Nome
      { wch: 15 },  // Categoria
      { wch: 18 },  // Código de Barras
      { wch: 12 },  // Custo Médio
      { wch: 12 },  // Preço Venda
      { wch: 10 },  // Markup
      { wch: 14 },  // Estoque Atual
      { wch: 16 },  // Controla Estoque
      { wch: 10 },  // Status
      { wch: 30 }   // Observações
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers para download
    const dataAtual = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=produtos_${dataAtual}.xlsx`);
    
    res.send(excelBuffer);
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    res.status(500).json({ error: 'Erro ao exportar produtos para Excel' });
  }
});

// GET - Exportar produtos para CSV
router.get('/exportar/csv', async (req: Request, res: Response) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: { estoque: true },
      orderBy: { nome: 'asc' }
    });

    // Preparar dados para o CSV
    const dadosCSV = produtos.map((p: any) => ({
      'Código': p.id,
      'Nome': p.nome,
      'Categoria': p.categoria || '',
      'Código de Barras': p.codigoBarras || '',
      'Custo Médio': p.custoMedio ? parseFloat(p.custoMedio.toString()).toFixed(2) : '0.00',
      'Preço Venda': p.precoVenda ? parseFloat(p.precoVenda.toString()).toFixed(2) : '0.00',
      'Markup': p.markup ? parseFloat(p.markup.toString()).toFixed(2) : '0.00',
      'Estoque Atual': p.estoque?.quantidade || 0,
      'Controla Estoque': p.controlaEstoque ? 'Sim' : 'Não',
      'Status': p.ativo ? 'Ativo' : 'Inativo'
    }));

    // Criar workbook e converter para CSV
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosCSV);
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');

    // Gerar CSV
    const csvData = XLSX.utils.sheet_to_csv(ws);

    // Configurar headers para download
    const dataAtual = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=produtos_${dataAtual}.csv`);
    
    // Adicionar BOM para suportar UTF-8 no Excel
    res.send('\ufeff' + csvData);
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    res.status(500).json({ error: 'Erro ao exportar produtos para CSV' });
  }
});

// ENGENHARIA - GET - Obter engenharia de um produto
router.get('/:id/engenharia', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const engenharia = await prisma.engenhariaProduto.findMany({
      where: { produtoId: id },
      include: {
        componente: {
          select: {
            id: true,
            nome: true,
            custoMedio: true,
            codigoInterno: true,
            categoria: true
          }
        }
      }
    });

    res.json(engenharia);
  } catch (error) {
    console.error('Erro ao buscar engenharia:', error);
    res.status(500).json({ error: 'Erro ao buscar engenharia' });
  }
});

// ENGENHARIA - POST - Adicionar componente à engenharia
router.post('/:id/engenharia', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { componenteId, quantidade } = req.body;

    if (!componenteId || !quantidade || quantidade <= 0) {
      return res.status(400).json({ error: 'ComponenteId e quantidade são obrigatórios' });
    }

    // Validar que o produto e componente existem
    const [produto, componente] = await Promise.all([
      prisma.produto.findUnique({ where: { id } }),
      prisma.produto.findUnique({ where: { id: componenteId } })
    ]);

    if (!produto || !componente) {
      return res.status(404).json({ error: 'Produto ou componente não encontrado' });
    }

    // Criar ou atualizar engenharia
    const engenharia = await prisma.engenhariaProduto.upsert({
      where: { produtoId_componenteId: { produtoId: id, componenteId } },
      update: { quantidade: parseFloat(quantidade.toString()) },
      create: {
        produtoId: id,
        componenteId,
        quantidade: parseFloat(quantidade.toString())
      },
      include: {
        componente: {
          select: {
            id: true,
            nome: true,
            custoMedio: true,
            codigoInterno: true,
            categoria: true
          }
        }
      }
    });

    res.json(engenharia);
  } catch (error) {
    console.error('Erro ao adicionar componente à engenharia:', error);
    res.status(500).json({ error: 'Erro ao adicionar componente' });
  }
});

// ENGENHARIA - DELETE - Remover componente da engenharia
router.delete('/:id/engenharia/:componenteId', async (req: Request, res: Response) => {
  try {
    const { id, componenteId } = req.params;

    await prisma.engenhariaProduto.delete({
      where: { produtoId_componenteId: { produtoId: id, componenteId } }
    });

    res.json({ message: 'Componente removido da engenharia' });
  } catch (error) {
    console.error('Erro ao remover componente:', error);
    res.status(500).json({ error: 'Erro ao remover componente' });
  }
});

// ENGENHARIA - POST - Calcular e atualizar custo médio do produto
router.post('/:id/engenharia/calcular-custo', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar todos os componentes da engenharia
    const engenharia = await prisma.engenhariaProduto.findMany({
      where: { produtoId: id },
      include: { componente: true }
    });

    // Calcular custo total
    const custoTotal = engenharia.reduce((acc, item) => {
      return acc + (item.componente.custoMedio * item.quantidade);
    }, 0);

    // Atualizar o custo médio do produto
    const produtoAtualizado = await prisma.produto.update({
      where: { id },
      data: { custoMedio: custoTotal }
    });

    res.json({
      message: 'Custo médio atualizado',
      custoMedio: produtoAtualizado.custoMedio,
      componentes: engenharia.length,
      detalhes: engenharia.map(e => ({
        componente: e.componente.nome,
        quantidade: e.quantidade,
        custoUnitario: e.componente.custoMedio,
        subtotal: e.componente.custoMedio * e.quantidade
      }))
    });
  } catch (error) {
    console.error('Erro ao calcular custo:', error);
    res.status(500).json({ error: 'Erro ao calcular custo' });
  }
});

export default router;
