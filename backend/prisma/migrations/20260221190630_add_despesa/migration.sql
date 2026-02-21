-- CreateTable
CREATE TABLE "despesas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'VARIÁVEL',
    "data" DATETIME NOT NULL,
    "isRecorrente" BOOLEAN NOT NULL DEFAULT false,
    "mesesRecorrencia" INTEGER,
    "mesInicio" INTEGER,
    "anoInicio" INTEGER,
    "observacao" TEXT,
    "paga" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "despesas_data_idx" ON "despesas"("data");

-- CreateIndex
CREATE INDEX "despesas_tipo_idx" ON "despesas"("tipo");

-- CreateIndex
CREATE INDEX "despesas_categoria_idx" ON "despesas"("categoria");
