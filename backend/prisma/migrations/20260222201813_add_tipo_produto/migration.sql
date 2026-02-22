-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "codigoInterno" TEXT,
    "codigoBarras" TEXT,
    "custoMedio" REAL NOT NULL DEFAULT 0,
    "precoVenda" REAL NOT NULL,
    "imagemUrl" TEXT,
    "markup" REAL DEFAULT 0,
    "tipo" TEXT NOT NULL DEFAULT 'COMPRADO',
    "controlaEstoque" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);
INSERT INTO "new_produtos" ("ativo", "atualizadoEm", "categoria", "codigoBarras", "codigoInterno", "controlaEstoque", "criadoEm", "custoMedio", "descricao", "id", "imagemUrl", "markup", "nome", "precoVenda") SELECT "ativo", "atualizadoEm", "categoria", "codigoBarras", "codigoInterno", "controlaEstoque", "criadoEm", "custoMedio", "descricao", "id", "imagemUrl", "markup", "nome", "precoVenda" FROM "produtos";
DROP TABLE "produtos";
ALTER TABLE "new_produtos" RENAME TO "produtos";
CREATE UNIQUE INDEX "produtos_codigoInterno_key" ON "produtos"("codigoInterno");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
