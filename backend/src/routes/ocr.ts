import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configuração do multer para upload de cupons
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/cupons';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cupom-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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

// POST - Upload e processamento de cupom fiscal (STUB)
router.post('/processar-cupom', upload.single('cupom'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Imagem do cupom é obrigatória' });
    }
    
    const imagemUrl = `/uploads/cupons/${req.file.filename}`;
    
    // Criar registro do OCR
    const ocrCupom = await prisma.oCRCupom.create({
      data: {
        imagemUrl,
        status: 'PENDENTE'
      }
    });
    
    // TODO: Integrar com Tesseract OCR
    // Por enquanto, retorna um stub simulando itens detectados
    const itensSimulados = [
      { nome: 'COCA COLA 2L', quantidade: 5, precoUnitario: 3.00 },
      { nome: 'AGUA MINERAL 500ML', quantidade: 2, precoUnitario: 1.50 },
      { nome: 'SUCO DEL VALLE 1L', quantidade: 3, precoUnitario: 5.00 }
    ];
    
    // Atualizar registro com itens detectados
    const ocrAtualizado = await prisma.oCRCupom.update({
      where: { id: ocrCupom.id },
      data: {
        itensDetectados: JSON.stringify(itensSimulados),
        status: 'PROCESSADO',
        processadoEm: new Date()
      }
    });
    
    res.json({
      id: ocrAtualizado.id,
      imagemUrl: ocrAtualizado.imagemUrl,
      itensDetectados: itensSimulados,
      status: ocrAtualizado.status,
      mensagem: 'Cupom processado (modo simulação). Confirme os itens antes de dar entrada no estoque.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao processar cupom' });
  }
});

// POST - Confirmar itens do OCR e dar entrada no estoque
router.post('/confirmar-entrada', async (req: Request, res: Response) => {
  try {
    const { ocrId, itens } = req.body;
    
    if (!ocrId || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ error: 'ID do OCR e itens são obrigatórios' });
    }
    
    // Verificar se OCR existe
    const ocr = await prisma.oCRCupom.findUnique({ where: { id: ocrId } });
    if (!ocr) {
      return res.status(404).json({ error: 'Registro OCR não encontrado' });
    }
    
    const resultados = [];
    
    // Processar cada item confirmado
    for (const item of itens) {
      const { produtoId, quantidade, custoUnitario } = item;
      
      if (!produtoId || !quantidade || !custoUnitario) {
        continue;
      }
      
      try {
        // Buscar produto
        const produto = await prisma.produto.findUnique({
          where: { id: produtoId },
          include: { estoque: true }
        });
        
        if (!produto) {
          resultados.push({ produtoId, erro: 'Produto não encontrado' });
          continue;
        }
        
        // Calcular novo custo médio
        const estoqueAtual = produto.estoque?.quantidade || 0;
        const custoMedioAtual = produto.custoMedio || 0;
        const qtd = parseFloat(quantidade);
        const custo = parseFloat(custoUnitario);
        
        const novoCustoMedio = estoqueAtual === 0
          ? custo
          : ((estoqueAtual * custoMedioAtual) + (qtd * custo)) / (estoqueAtual + qtd);
        
        // Atualizar em transação
        await prisma.$transaction(async (tx) => {
          // Registrar entrada
          await tx.entradaEstoque.create({
            data: {
              produtoId,
              quantidade: qtd,
              custoUnitario: custo,
              observacao: `Entrada via OCR - Cupom ID: ${ocrId}`
            }
          });
          
          // Atualizar custo médio
          await tx.produto.update({
            where: { id: produtoId },
            data: { custoMedio: novoCustoMedio }
          });
          
          // Atualizar estoque
          await tx.estoque.upsert({
            where: { produtoId },
            update: { quantidade: { increment: qtd } },
            create: { produtoId, quantidade: qtd }
          });
        });
        
        resultados.push({ 
          produtoId, 
          nome: produto.nome, 
          sucesso: true 
        });
      } catch (error: any) {
        resultados.push({ 
          produtoId, 
          erro: error.message 
        });
      }
    }
    
    res.json({
      mensagem: 'Entrada processada',
      resultados
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao confirmar entrada' });
  }
});

// GET - Listar cupons processados
router.get('/cupons', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    
    const cupons = await prisma.oCRCupom.findMany({
      where: {
        ...(status && { status: String(status).toUpperCase() })
      },
      orderBy: { criadoEm: 'desc' }
    });
    
    const cuponsFormatados = cupons.map(c => ({
      ...c,
      itensDetectados: c.itensDetectados ? JSON.parse(c.itensDetectados) : null
    }));
    
    res.json(cuponsFormatados);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cupons' });
  }
});

export default router;
