-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_entradas_estoque" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "custoUnitario" REAL NOT NULL,
    "dataEntrada" DATETIME NOT NULL,
    "numeroCupom" TEXT,
    "tipoEntrada" TEXT NOT NULL DEFAULT 'MANUAL',
    "tipoMovimento" TEXT NOT NULL DEFAULT 'ENTRADA',
    "comandaId" TEXT,
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entradas_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "entradas_estoque_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_entradas_estoque" ("criadoEm", "custoUnitario", "dataEntrada", "id", "numeroCupom", "observacao", "produtoId", "quantidade", "tipoEntrada", "tipoMovimento") SELECT "criadoEm", "custoUnitario", "dataEntrada", "id", "numeroCupom", "observacao", "produtoId", "quantidade", "tipoEntrada", "tipoMovimento" FROM "entradas_estoque";
DROP TABLE "entradas_estoque";
ALTER TABLE "new_entradas_estoque" RENAME TO "entradas_estoque";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
