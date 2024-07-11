-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destino" TEXT NOT NULL,
    "inicio_viagem" DATETIME NOT NULL,
    "fim_viagem" DATETIME NOT NULL,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "criacao_viagem" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
