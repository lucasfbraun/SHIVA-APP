import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import produtosRouter from './routes/produtos';
import estoqueRouter from './routes/estoque';
import comandasRouter from './routes/comandas';
import relatoriosRouter from './routes/relatorios';
import ocrRouter from './routes/ocr';

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

app.use('/api/produtos', produtosRouter);
app.use('/api/estoque', estoqueRouter);
app.use('/api/comandas', comandasRouter);
app.use('/api/relatorios', relatoriosRouter);
app.use('/api/ocr', ocrRouter);

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor SHIVA rodando na porta ${PORT}`);
});
