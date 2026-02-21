import prisma from './src/lib/prisma';
import bcryptjs from 'bcryptjs';

async function main() {
  try {
    // Criar usuário de teste
    const emailTeste = 'teste@shiva.com';
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email: emailTeste }
    });

    if (!usuarioExistente) {
      const senhaCriptografada = await bcryptjs.hash('senha123', 10);
      const usuario = await prisma.usuario.create({
        data: {
          email: emailTeste,
          senha: senhaCriptografada,
          nome: 'Teste Shiva'
        }
      });
      console.log('✅ Usuário criado:', usuario);
    } else {
      console.log('ℹ️ Usuário já existe:', usuarioExistente);
    }

    // Criar alguns produtos de teste
    const protudosExistentes = await prisma.produto.count();
    if (protudosExistentes === 0) {
      const produtos = await prisma.produto.createMany({
        data: [
          { nome: 'Café', precoVenda: 5.00, custoMedio: 1.50, categoria: 'BEBIDAS', ativo: true },
          { nome: 'Refrigerante', precoVenda: 4.00, custoMedio: 1.20, categoria: 'BEBIDAS', ativo: true },
          { nome: 'Salgado', precoVenda: 6.50, custoMedio: 2.00, categoria: 'COMIDA', ativo: true }
        ]
      });
      console.log('✅ Produtos criados:', produtos);
    } else {
      console.log('ℹ️ Produtos já existem');
    }

    // Criar cliente de teste
    const clienteExistente = await prisma.cliente.findUnique({
      where: { cpf: '12345678900' }
    });
    
    if (!clienteExistente) {
      const cliente = await prisma.cliente.create({
        data: {
          nomeCompleto: 'Cliente Teste',
          telefone: '11999999999',
          cpf: '12345678900',
          totalGasto: 0,
          qtdComandas: 0,
          ativo: true
        }
      });
      console.log('✅ Cliente criado:', cliente);
    } else {
      console.log('ℹ️ Cliente já existe');
    }

    // Criar comanda com itens
    const hoje = new Date();
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);

    const produtosCadastrados = await prisma.produto.findMany({ take: 2 });
    const cliente = await prisma.cliente.findFirst({ where: { cpf: '12345678900' } });

    if (produtosCadastrados.length > 0) {
      const totalComanda = produtosCadastrados.slice(0, 2).reduce((acc, p, idx) => acc + (p.precoVenda * (idx + 1)), 0);
      const comanda = await prisma.comanda.create({
        data: {
          nomeCliente: cliente?.nomeCompleto || 'Cliente Teste',
          clienteId: cliente?.id,
          status: 'FECHADA',
          total: totalComanda,
          dataAbertura: new Date(inicioHoje.getTime() - 2 * 60 * 60 * 1000),
          dataFechamento: new Date(inicioHoje.getTime() - 1 * 60 * 60 * 1000),
          itens: {
            create: produtosCadastrados.slice(0, 2).map((p, idx) => ({
              produtoId: p.id,
              nomeProduto: p.nome,
              quantidade: idx + 1,
              precoUnitario: p.precoVenda,
              subtotal: p.precoVenda * (idx + 1)
            }))
          }
        },
        include: { itens: true }
      });
      console.log('✅ Comanda criada:', comanda);
    }

    // Criar despesa de teste
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const despesaExistente = await prisma.despesa.findFirst({
      where: {
        data: {
          gte: new Date(ano, mes - 1, 1),
          lte: new Date(ano, mes, 0, 23, 59, 59)
        }
      }
    });

    if (!despesaExistente) {
      const despesa = await prisma.despesa.create({
        data: {
          descricao: 'Aluguel - Teste',
          valor: 1000.00,
          categoria: 'ALUGUEL',
          tipo: 'FIXA',
          data: new Date(),
          isRecorrente: false,
          paga: true,
          dataPagamento: new Date()
        }
      });
      console.log('✅ Despesa criada:', despesa);
    } else {
      console.log('ℹ️ Despesa já existe');
    }

    console.log('\n✅ Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
