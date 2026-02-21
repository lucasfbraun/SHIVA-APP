-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "codigoInterno" TEXT,
    "custoMedio" REAL NOT NULL DEFAULT 0,
    "precoVenda" REAL NOT NULL,
    "imagemUrl" TEXT,
    "markup" REAL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "estoques" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "quantidade" REAL NOT NULL DEFAULT 0,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "estoques_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entradas_estoque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entradas_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comandas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeCliente" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "total" REAL NOT NULL DEFAULT 0,
    "dataAbertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" DATETIME,
    "observacao" TEXT
);

-- CreateTable
CREATE TABLE "itens_comanda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comandaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "precoUnitario" REAL NOT NULL,
    "subtotal" REAL NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itens_comanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "itens_comanda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ocr_cupons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "imagemUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "itensDetectados" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processadoEm" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigoInterno_key" ON "produtos"("codigoInterno");

-- CreateIndex
CREATE UNIQUE INDEX "estoques_produtoId_key" ON "estoques"("produtoId");
