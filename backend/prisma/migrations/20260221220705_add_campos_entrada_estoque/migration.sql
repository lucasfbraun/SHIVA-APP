/*
  Warnings:

  - Added the required column `dataEntrada` to the `entradas_estoque` table without a default value. This is not possible if the table is not empty.

*/
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
    "observacao" TEXT,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "entradas_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_entradas_estoque" ("criadoEm", "custoUnitario", "id", "observacao", "produtoId", "quantidade") SELECT "criadoEm", "custoUnitario", "id", "observacao", "produtoId", "quantidade" FROM "entradas_estoque";
DROP TABLE "entradas_estoque";
ALTER TABLE "new_entradas_estoque" RENAME TO "entradas_estoque";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
