import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import tesseract from 'node-tesseract-ocr';
import pdfParse from 'pdf-parse';

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
    const allowedTypes = /jpeg|jpg|png|webp|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype === 'application/pdf' || allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens (JPEG, PNG, WebP) e PDFs são permitidos'));
  }
});

// Função para extrair texto de arquivo (imagem ou PDF)
async function extrairTexto(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    // Extrair texto de PDF
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } else {
    // Extrair texto de imagem com Tesseract (português)
    const config = {
      lang: 'por',
      oem: 1,
      psm: 3,
    };
    const text = await tesseract.recognize(filePath, config);
    return text;
  }
}

// Função para parsear texto de cupom fiscal
function parsearCupomFiscal(texto: string): Array<{ nome: string; quantidade: number; precoUnitario: number }> {
  const itens: Array<{ nome: string; quantidade: number; precoUnitario: number }> = [];
  const linhas = texto.split('\n');
  
  // Regex para detectar linhas com padrão de item:
  // Exemplos: "COCA COLA 2L  5x3.00" ou "001 AGUA MINERAL 500ML 2 x 1.50"
  const regexItem = /([A-ZÀ-Ú0-9\s]+?)\s+(\d+)[\s]*[xX×]?[\s]*(\d+[,.]\d{2})/i;
  
  for (const linha of linhas) {
    const match = linha.match(regexItem);
    if (match) {
      const nome = match[1].trim().replace(/^\d+\s+/, ''); // Remove número inicial se houver
      const quantidade = parseInt(match[2]);
      const precoStr = match[3].replace(',', '.');
      const precoUnitario = parseFloat(precoStr);
      
      if (nome && quantidade > 0 && precoUnitario > 0) {
        itens.push({ nome, quantidade, precoUnitario });
      }
    }
  }
  
  return itens;
}

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
    
    try {
      // Construir caminho completo do arquivo
      const filePath = path.join(process.cwd(), 'uploads', 'cupons', req.file.filename);
      
      // Extrair texto do arquivo (imagem ou PDF)
      const textoExtraido = await extrairTexto(filePath);
      
      // Parsear texto para identificar itens do cupom
      const itensDetectados = parsearCupomFiscal(textoExtraido);
      
      // Atualizar registro com itens detectados
      const ocrAtualizado = await prisma.oCRCupom.update({
        where: { id: ocrCupom.id },
        data: {
          itensDetectados: JSON.stringify(itensDetectados),
          status: 'PROCESSADO',
          processadoEm: new Date()
        }
      });
      
      res.json({
        id: ocrAtualizado.id,
        imagemUrl: ocrAtualizado.imagemUrl,
        itensDetectados,
        status: ocrAtualizado.status,
        textoExtraido, // Retornar texto bruto para debug/conferência
        mensagem: itensDetectados.length > 0 
          ? `${itensDetectados.length} item(ns) detectado(s). Confirme os dados antes de dar entrada no estoque.`
          : 'Nenhum item foi detectado no cupom. Verifique a qualidade da imagem.'
      });
    } catch (ocrError: any) {
      // Se OCR falhar, marcar como erro
      await prisma.oCRCupom.update({
        where: { id: ocrCupom.id },
        data: {
          status: 'ERRO',
          processadoEm: new Date()
        }
      });
      
      throw new Error(`Erro ao processar OCR: ${ocrError.message}`);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Erro ao processar cupom' });
  }
});

// POST - Confirmar itens do OCR e dar entrada no estoque
router.post('/confirmar-entrada', async (req: Request, res: Response) => {
  try {
    const { ocrId, itens, dataEntrada, numeroCupom } = req.body;
    
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
              dataEntrada: dataEntrada ? new Date(dataEntrada) : new Date(),
              numeroCupom: numeroCupom || null,
              tipoEntrada: 'OCR',
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
