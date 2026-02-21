import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { generateToken, hashPassword, comparePassword } from '../lib/auth';

const router = Router();

// POST - Registrar novo usuário
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, senha, nome } = req.body;

    if (!email || !senha || !nome) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se email já existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const senhaHash = await hashPassword(senha);

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        email,
        senha: senhaHash,
        nome
      },
      select: {
        id: true,
        email: true,
        nome: true
      }
    });

    const token = generateToken(usuario.id);

    res.status(201).json({
      usuario,
      token
    });
  } catch (error: any) {
    console.error('Erro ao registrar:', error);
    res.status(500).json({ error: error.message || 'Erro ao registrar usuário' });
  }
});

// POST - Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Validar senha
    const senhaValida = await comparePassword(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar token
    const token = generateToken(usuario.id);

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome
      },
      token
    });
  } catch (error: any) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: error.message || 'Erro ao fazer login' });
  }
});

// GET - Dados do usuário logado
router.get('/me', (req: any, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    // Aqui você poderia buscar os dados do usuário no banco
    res.json({ userId: req.userId });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
});

export default router;
