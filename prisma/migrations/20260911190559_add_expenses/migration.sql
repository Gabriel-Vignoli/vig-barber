-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('ALUGUEL', 'FUNCIONARIOS', 'PRODUTOS', 'EQUIPAMENTOS', 'MARKETING', 'CONTAS', 'MANUTENCAO', 'OUTROS');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_date_idx" ON "expenses"("date");
