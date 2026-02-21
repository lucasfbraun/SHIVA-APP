<div align="center">
  <img src="logo.jpeg" alt="SHIVA Logo" width="200"/>
</div>

# SHIVA - Sistema de Gestão

Sistema que fiz pra ajudar uma amiga que tem uma conveniência. Ela tava anotando tudo em caderno e precisava de algo mais organizado pra controlar produtos, comandas e estoque.

## Stack

**Backend:**
- Node.js com Express e TypeScript
- Prisma ORM + SQLite
- Multer pra upload de imagens

**Frontend:**
- React + TypeScript + Vite
- Tailwind CSS
- React Router, Axios, date-fns
- Lucide pra ícones

## O que tem

**Produtos**
- Cadastro com foto (pode tirar direto pela câmera ou fazer upload)
- Calcula preço de venda automaticamente baseado no markup configurado
- Sistema de categorias e controle de estoque
- Custo médio ponderado quando dá entrada

**Comandas**
- Abre sem precisar de CPF, só o nome do cliente
- Adiciona e remove produtos enquanto a comanda tá aberta
- Quando fecha, faz a baixa automática no estoque

**Estoque**
- Entrada manual de produtos
- Histórico de todas as movimentações
- Mostra produtos com estoque baixo
- Calcula custo médio automaticamente

**Relatórios**
- Dashboard com as principais métricas
- Ticket médio, faturamento, margem de lucro
- Lista dos produtos mais vendidos

**OCR de Cupom** (ainda não integrado)
- Tá preparado pra receber foto de cupom fiscal
- Vai identificar os produtos e dar entrada no estoque
- Por enquanto só simula, mas a estrutura já tá pronta

## Como rodar

Precisa ter Node.js instalado (versão 18 ou mais nova).

**Backend:**
```bash
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
Roda na porta 3001.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Roda na porta 3000.

Depois é só abrir http://localhost:3000 no navegador.

## 📁 Estrutura do Projeto

```
shiva-app/
├── backend/
│   ├── src/
│   │   ├── server.ts          # Servidor Express
│   │   ├── lib/
│   │   │   └── prisma.ts      # Cliente Prisma
│   │   └── routes/
│   │       ├── produtos.ts    # CRUD de produtos
│   │       ├── estoque.ts     # Gestão de estoque
│   │       ├── comandas.ts    # Gestão de comandas
│   │       ├── relatorios.ts  # Relatórios e métricas
│   │       └── ocr.ts         # OCR de cupons
│   ├── prisma/
│   │   ├── schema.prisma      # Schema do banco
│   │   └── migrations/        # Migrations
│  Estrutura

```
backend/
  src/
    routes/        # APIs (produtos, estoque, comandas, relatorios, ocr)
    lib/           # Prisma client
  prisma/          # Schema e migrations
  uploads/         # Fotos dos produtos e cupons

frontend/
  src/
    pages/         # Telas principais
    components/    # Layout e navegação
    services/      # Chamadas pra API
    types/         # Tipos TypeScript
```

## Detalhes técnicos

**Produtos:**
- Preço de venda calculado com markup: `preco_venda = custo * (1 + markup/100)`
- Soft delete (desativa ao invés de apagar)

**Estoque:**
- Usa custo médio ponderado quando entra mercadoria:
  `novo_custo = (qtd_atual * custo_atual + qtd_nova * custo_novo) / qtd_total`
- Baixa automática quando fecha a comanda

**Comandas:**
- Só aceita nome do cliente, sem CPF
- Enquanto tá aberta pode adicionar/remover itens
- Ao fechar não pode mais mexer

**Relatórios:**
- Só conta comandas fechadas nos cálculos
- Ticket médio = total vendido / numero de comandas

## 🗄️ Banco de Dados

Usa **SQLite** como banco de dados relacional embarcado. Todos os dados ficam no arquivo `backend/prisma/dev.db`.

### Schema Prisma

```prisma
// Usuários para autenticação
model Usuario {
  id    String   @id @default(cuid())
  email String   @unique
  senha String
  nome  String
}

// Produtos do catálogo
model Produto {
  id            String   @id @default(cuid())
  nome          String
  categoria     String
  codigoInterno String?  @unique
  precoCusto    Float
  precoVenda    Float
  markup        Float    @default(0)
  foto          String?
  estoque       Estoque?
  entradas      EntradaEstoque[]
  itensComanda  ItemComanda[]
}

// Controle de estoque por produto
model Estoque {
  id         String  @id @default(cuid())
  produtoId  String  @unique
  quantidade Int     @default(0)
  custoMedio Float   @default(0)
  produto    Produto @relation(fields: [produtoId], references: [id])
}

// Histórico de entradas de estoque
model EntradaEstoque {
  id             String   @id @default(cuid())
  produtoId      String
  quantidade     Int
  custoUnitario  Float
  custoTotal     Float
  data           DateTime @default(now())
  produto        Produto  @relation(fields: [produtoId], references: [id])
}

// Clientes cadastrados
model Cliente {
  id           String   @id @default(cuid())
  nomeCompleto String
  telefone     String?
  cpf          String?  @unique
  totalGasto   Float    @default(0)
  totalComandas Int     @default(0)
  ativo        Boolean  @default(true)
  comandas     Comanda[]
}

// Comandas (pedidos dos clientes)
model Comanda {
  id             String   @id @default(cuid())
  clienteId      String?
  nomeCliente    String?
  status         String   @default("ABERTA")
  total          Float    @default(0)
  dataAbertura   DateTime @default(now())
  dataFechamento DateTime?
  cliente        Cliente? @relation(fields: [clienteId], references: [id])
  itens          ItemComanda[]
}

// Itens dentro de cada comanda
model ItemComanda {
  id         String   @id @default(cuid())
  comandaId  String
  produtoId  String
  quantidade Int
  precoVenda Float
  subtotal   Float
  comanda    Comanda  @relation(fields: [comandaId], references: [id])
  produto    Produto  @relation(fields: [produtoId], references: [id])
}

// Despesas do mês
model Despesa {
  id              String   @id @default(cuid())
  descricao       String
  valor           Float
  categoria       String
  tipo            String   @default("VARIAVEL")
  mesReferencia   Int
  anoReferencia   Int
  recorrenteMeses Int      @default(1)
  dataPagamento   DateTime?
  status          String   @default("ABERTO")
}
```

### Diagrama de Relacionamentos

```
┌─────────────────┐
│    USUARIOS     │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ senha           │
│ nome            │
└─────────────────┘

┌─────────────────┐
│    PRODUTOS     │
├─────────────────┤
│ id (PK)         │
│ nome            │
│ categoria       │
│ precoCusto      │
│ precoVenda      │
│ markup          │
│ foto            │
└─────────────────┘
        │
        ├──→ ┌─────────────────┐
        │    │    ESTOQUES     │
        │    ├─────────────────┤
        │    │ id (PK)         │
        │    │ produtoId (FK)  │
        │    │ quantidade      │
        │    │ custoMedio      │
        │    └─────────────────┘
        │
        ├──→ ┌──────────────────┐
        │    │ ENTRADAS_ESTOQUE │
        │    ├──────────────────┤
        │    │ id (PK)          │
        │    │ produtoId (FK)   │
        │    │ quantidade       │
        │    │ custoUnitario    │
        │    └──────────────────┘
        │
        └──→ ┌──────────────────┐
             │  ITENS_COMANDA   │
             ├──────────────────┤
             │ id (PK)          │
             │ produtoId (FK)   │
             │ comandaId (FK)   │
             │ quantidade       │
             │ precoVenda       │
             │ subtotal         │
             └──────────────────┘

┌─────────────────┐
│    CLIENTES     │
├─────────────────┤
│ id (PK)         │
│ nomeCompleto    │
│ telefone        │
│ cpf (UNIQUE)    │
│ totalGasto      │
│ totalComandas   │
└─────────────────┘
        │
        └──→ ┌─────────────────┐
             │    COMANDAS     │
             ├─────────────────┤
             │ id (PK)         │
             │ clienteId (FK)  │
             │ nomeCliente     │
             │ status          │
             │ total           │
             │ dataAbertura    │
             │ dataFechamento  │
             └─────────────────┘
                     │
                     └──→ (ITENS_COMANDA)

┌─────────────────────────┐
│     DESPESAS            │
├─────────────────────────┤
│ id (PK)                 │
│ descricao               │
│ valor                   │
│ categoria               │
│ tipo (FIXA/VARIAVEL)    │
│ mesReferencia           │
│ anoReferencia           │
│ recorrenteMeses         │
│ status (ABERTO/PAGO)    │
└─────────────────────────┘
```

### Descrição das Tabelas

| Tabela | Descrição |
|--------|-----------|
| **usuarios** | Credenciais de acesso ao sistema |
| **produtos** | Catálogo de produtos disponíveis |
| **estoques** | Quantidade atual de cada produto |
| **entradas_estoque** | Histórico de todas as movimentações de entrada |
| **clientes** | Clientes cadastrados com histórico de gastos |
| **comandas** | Pedidos dos clientes (abertos/fechados) |
| **itens_comanda** | Produtos adicionados em cada comanda |
| **despesas** | Despesas fixas e variáveis do mês |

## 🚧 Próximas Implementações

- [ ] Integração real com Tesseract OCR
- [ ] Autenticação de usuários
- [ ] Backup automático do banco
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Notificações de estoque baixo
- [ ] Categorias personalizadas
- [ ] Múltiplas formas de pagamento
- [Comandos úteis

**Backend:**
```bash
npm run dev              # desenvolvimento
npm run build            # compila o TS
npm run prisma:studio    # abre interface do banco
```

**Frontend:**
```bash
npm run dev     # desenvolvimento
npm run build   # gera build de produção
```

## To-do

- [ ] Integrar OCR de verdade (Tesseract)
- [ ] Adicionar autenticação
- [ ] Exportar relatórios em PDF
- [ ] Backup automático do banco
- [ ] Notificação quando estoque tá baixo
- [ ] Histórico de alteração de preços

## Observações

- Tá usando SQLite como banco (arquivo dev.db na pasta backend)
- As imagens ficam salvas em `backend/uploads/`
- Backend roda na 3001, frontend na 3000
- O Vite já faz o proxy das chamadas pra API

## Se der algum problema

**Backend não sobe:**
- Vê se a porta 3001 tá livre
- Roda `npm run prisma:generate` de novo

**Frontend não abre:**
- Confirma se o backend tá rodando
- Tenta rodar `npm install` de novo
- Apaga node_modules e reinstala

**Imagens não carregam:**
- Vê se a pasta `backend/uploads/` existe
- Checa as permissões da pasta