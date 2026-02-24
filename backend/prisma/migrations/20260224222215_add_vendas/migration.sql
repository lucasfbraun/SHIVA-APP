-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroVenda" INTEGER NOT NULL,
    "clienteId" TEXT,
    "nomeCliente" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "desconto" REAL NOT NULL DEFAULT 0,
    "tipoDesconto" TEXT NOT NULL DEFAULT 'VALOR',
    "total" REAL NOT NULL DEFAULT 0,
    "valorPago" REAL NOT NULL DEFAULT 0,
    "valorRestante" REAL NOT NULL DEFAULT 0,
    "tipoPagamento" TEXT NOT NULL DEFAULT 'DINHEIRO',
    "dataAbertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" DATETIME,
    "observacao" TEXT,
    CONSTRAINT "vendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "itens_venda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vendaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "precoUnitario" REAL NOT NULL,
    "custoUnitario" REAL NOT NULL DEFAULT 0,
    "desconto" REAL NOT NULL DEFAULT 0,
    "tipoDesconto" TEXT NOT NULL DEFAULT 'VALOR',
    "subtotal" REAL NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itens_venda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "itens_venda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "vendas_numeroVenda_key" ON "vendas"("numeroVenda");
