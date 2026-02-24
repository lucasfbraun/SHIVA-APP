-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_comandas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroComanda" INTEGER NOT NULL,
    "clienteId" TEXT,
    "nomeCliente" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ABERTA',
    "total" REAL NOT NULL DEFAULT 0,
    "valorPago" REAL NOT NULL DEFAULT 0,
    "valorRestante" REAL NOT NULL DEFAULT 0,
    "desconto" REAL NOT NULL DEFAULT 0,
    "tipoDesconto" TEXT NOT NULL DEFAULT 'VALOR',
    "dataAbertura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFechamento" DATETIME,
    "observacao" TEXT,
    CONSTRAINT "comandas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_comandas" ("clienteId", "dataAbertura", "dataFechamento", "id", "nomeCliente", "numeroComanda", "observacao", "status", "total", "valorPago", "valorRestante") SELECT "clienteId", "dataAbertura", "dataFechamento", "id", "nomeCliente", "numeroComanda", "observacao", "status", "total", "valorPago", "valorRestante" FROM "comandas";
DROP TABLE "comandas";
ALTER TABLE "new_comandas" RENAME TO "comandas";
CREATE UNIQUE INDEX "comandas_numeroComanda_key" ON "comandas"("numeroComanda");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
