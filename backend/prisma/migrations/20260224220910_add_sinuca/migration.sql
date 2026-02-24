-- CreateTable
CREATE TABLE "sinuca_partidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL DEFAULT 'UNICA',
    "melhorDe" INTEGER NOT NULL DEFAULT 1,
    "clienteAId" TEXT NOT NULL,
    "clienteBId" TEXT NOT NULL,
    "vitoriasA" INTEGER NOT NULL DEFAULT 0,
    "vitoriasB" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "vencedorId" TEXT,
    "observacao" TEXT,
    "iniciadoEm" DATETIME,
    "finalizadoEm" DATETIME,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "sinuca_partidas_clienteAId_fkey" FOREIGN KEY ("clienteAId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sinuca_partidas_clienteBId_fkey" FOREIGN KEY ("clienteBId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sinuca_partidas_vencedorId_fkey" FOREIGN KEY ("vencedorId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sinuca_torneios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'TODOS_CONTRA_TODOS',
    "melhorDe" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sinuca_torneio_participantes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "torneioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sinuca_torneio_participantes_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "sinuca_torneios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sinuca_torneio_participantes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sinuca_torneio_partidas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "torneioId" TEXT NOT NULL,
    "rodada" INTEGER NOT NULL,
    "clienteAId" TEXT NOT NULL,
    "clienteBId" TEXT NOT NULL,
    "vitoriasA" INTEGER NOT NULL DEFAULT 0,
    "vitoriasB" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "vencedorId" TEXT,
    "melhorDe" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "sinuca_torneio_partidas_torneioId_fkey" FOREIGN KEY ("torneioId") REFERENCES "sinuca_torneios" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sinuca_torneio_partidas_clienteAId_fkey" FOREIGN KEY ("clienteAId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sinuca_torneio_partidas_clienteBId_fkey" FOREIGN KEY ("clienteBId") REFERENCES "clientes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sinuca_torneio_partidas_vencedorId_fkey" FOREIGN KEY ("vencedorId") REFERENCES "clientes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "sinuca_torneio_participantes_torneioId_clienteId_key" ON "sinuca_torneio_participantes"("torneioId", "clienteId");
