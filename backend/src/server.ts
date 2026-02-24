import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import produtosRouter from './routes/produtos';
import estoqueRouter from './routes/estoque';
import comandasRouter from './routes/comandas';
import relatoriosRouter from './routes/relatorios';
import ocrRouter from './routes/ocr';
import despesasRouter from './routes/despesas';
import clientesRouter from './routes/clientes';
import sinucaRouter from './routes/sinuca';
import { authMiddleware } from './lib/authMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (uploads)
app.use('/uploads', express.static('uploads'));

// Rotas
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas de autenticação (públicas)
app.use('/api/auth', authRouter);

// Middleware de autenticação para rotas protegidas
app.use('/api/produtos', authMiddleware, produtosRouter);
app.use('/api/estoque', authMiddleware, estoqueRouter);
app.use('/api/comandas', authMiddleware, comandasRouter);
app.use('/api/relatorios', authMiddleware, relatoriosRouter);
app.use('/api/ocr', authMiddleware, ocrRouter);
app.use('/api/despesas', authMiddleware, despesasRouter);
app.use('/api/clientes', authMiddleware, clientesRouter);
app.use('/api/sinuca', authMiddleware, sinucaRouter);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SHIVA rodando na porta ${PORT}`);
});
