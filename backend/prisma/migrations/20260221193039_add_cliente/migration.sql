-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nomeCompleto" TEXT NOT NULL,
    "telefone" TEXT,
    "cpf" TEXT,
    "totalGasto" REAL NOT NULL DEFAULT 0,
    "qtdComandas" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comandas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT,
    "nomeCliente" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "total" REAL NOT NULL DEFAULT 0,
    "dataAbertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" DATETIME,
    "observacao" TEXT,
    CONSTRAINT "comandas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_comandas" ("dataAbertura", "dataFechamento", "id", "nomeCliente", "observacao", "status", "total") SELECT "dataAbertura", "dataFechamento", "id", "nomeCliente", "observacao", "status", "total" FROM "comandas";
DROP TABLE "comandas";
ALTER TABLE "new_comandas" RENAME TO "comandas";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");
