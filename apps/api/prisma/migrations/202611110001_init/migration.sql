-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('STARTED', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "RunMode" AS ENUM ('LIVE', 'DEMO', 'LOCAL');

-- CreateEnum
CREATE TYPE "Signal" AS ENUM ('AGGRAVATION', 'STABILIZATION', 'RECOVERY', 'INDETERMINATE');

-- CreateEnum
CREATE TYPE "Confidence" AS ENUM ('CONFIRMED', 'REPORTED', 'RUMOR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('CANCELLATION', 'DELAY', 'RENEGOTIATION', 'CONTRACT', 'FINANCING');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ticker" TEXT,
    "region" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "publicDisplayAllowed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketClose" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "tradingDate" DATE NOT NULL,
    "close" DECIMAL(20,6) NOT NULL,
    "provider" TEXT NOT NULL,
    "redistributable" BOOLEAN NOT NULL,

    CONSTRAINT "MarketClose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "companyId" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "companyId" TEXT,
    "claim" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "confidence" "Confidence" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "confidence" "Confidence" NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Run" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "mode" "RunMode" NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'STARTED',
    "sourceFailures" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "reportDate" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "signal" "Signal" NOT NULL,
    "riskScore" INTEGER,
    "coverage" DOUBLE PRECISION NOT NULL,
    "minimumCoverage" DOUBLE PRECISION NOT NULL,
    "missingData" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportEvidence" (
    "reportId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,

    CONSTRAINT "ReportEvidence_pkey" PRIMARY KEY ("reportId","evidenceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_stableKey_key" ON "Asset"("stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "MarketClose_assetId_tradingDate_provider_key" ON "MarketClose"("assetId", "tradingDate", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Document_stableKey_key" ON "Document"("stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "Evidence_stableKey_key" ON "Evidence"("stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "Event_stableKey_key" ON "Event"("stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "Run_stableKey_key" ON "Run"("stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "Report_stableKey_key" ON "Report"("stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "Report_runId_key" ON "Report"("runId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketClose" ADD CONSTRAINT "MarketClose_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_runId_fkey" FOREIGN KEY ("runId") REFERENCES "Run"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportEvidence" ADD CONSTRAINT "ReportEvidence_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportEvidence" ADD CONSTRAINT "ReportEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
