-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_itens_comanda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comandaId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "nomeProduto" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "precoUnitario" REAL NOT NULL,
    "custoUnitario" REAL NOT NULL DEFAULT 0,
    "subtotal" REAL NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "abonado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "itens_comanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "itens_comanda_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_itens_comanda" ("comandaId", "criadoEm", "id", "nomeProduto", "pago", "precoUnitario", "produtoId", "quantidade", "subtotal") SELECT "comandaId", "criadoEm", "id", "nomeProduto", "pago", "precoUnitario", "produtoId", "quantidade", "subtotal" FROM "itens_comanda";
DROP TABLE "itens_comanda";
ALTER TABLE "new_itens_comanda" RENAME TO "itens_comanda";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
