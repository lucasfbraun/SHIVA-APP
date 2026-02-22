-- DropIndex
DROP INDEX "despesas_categoria_idx";

-- CreateTable
CREATE TABLE "engenharia_produtos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "produtoId" TEXT NOT NULL,
    "componenteId" TEXT NOT NULL,
    "quantidade" REAL NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "engenharia_produtos_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "engenharia_produtos_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "produtos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "engenharia_produtos_produtoId_componenteId_key" ON "engenharia_produtos"("produtoId", "componenteId");
