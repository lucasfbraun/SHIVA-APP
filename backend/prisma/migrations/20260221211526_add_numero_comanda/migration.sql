/*
  Warnings:

  - Added the required column `numeroComanda` to the `comandas` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Criar nova tabela com numeroComanda
CREATE TABLE "new_comandas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroComanda" INTEGER NOT NULL,
    "clienteId" TEXT,
    "nomeCliente" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "total" REAL NOT NULL DEFAULT 0,
    "dataAbertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" DATETIME,
    "observacao" TEXT,
    CONSTRAINT "comandas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Copiar dados existentes com numeração sequencial (usando ROWID como base)
INSERT INTO "new_comandas" ("id", "numeroComanda", "clienteId", "nomeCliente", "status", "total", "dataAbertura", "dataFechamento", "observacao")
SELECT "id", ROW_NUMBER() OVER (ORDER BY "dataAbertura") as numeroComanda, "clienteId", "nomeCliente", "status", "total", "dataAbertura", "dataFechamento", "observacao" 
FROM "comandas";

-- Remover tabela antiga
DROP TABLE "comandas";

-- Renomear nova tabela
ALTER TABLE "new_comandas" RENAME TO "comandas";

-- Criar índice único
CREATE UNIQUE INDEX "comandas_numeroComanda_key" ON "comandas"("numeroComanda");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
