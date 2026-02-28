-- CreateTable
CREATE TABLE "public"."ImportBatch" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "sourcePath" TEXT NOT NULL,
    "sourceFile" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SourceSheet" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sheetOrder" INTEGER NOT NULL,
    "columns" JSONB NOT NULL,
    "headerRow" INTEGER NOT NULL,
    "rowCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SourceSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SourceRow" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "importBatchId" TEXT NOT NULL,
    "sourceSheetId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "rowValues" JSONB NOT NULL,
    "rowObject" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportBatch_buildingId_createdAt_idx" ON "public"."ImportBatch"("buildingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SourceSheet_importBatchId_name_key" ON "public"."SourceSheet"("importBatchId", "name");

-- CreateIndex
CREATE INDEX "SourceSheet_buildingId_name_idx" ON "public"."SourceSheet"("buildingId", "name");

-- CreateIndex
CREATE INDEX "SourceRow_buildingId_importBatchId_idx" ON "public"."SourceRow"("buildingId", "importBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRow_sourceSheetId_rowIndex_key" ON "public"."SourceRow"("sourceSheetId", "rowIndex");

-- AddForeignKey
ALTER TABLE "public"."ImportBatch" ADD CONSTRAINT "ImportBatch_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceSheet" ADD CONSTRAINT "SourceSheet_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceSheet" ADD CONSTRAINT "SourceSheet_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "public"."ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceRow" ADD CONSTRAINT "SourceRow_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceRow" ADD CONSTRAINT "SourceRow_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "public"."ImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SourceRow" ADD CONSTRAINT "SourceRow_sourceSheetId_fkey" FOREIGN KEY ("sourceSheetId") REFERENCES "public"."SourceSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
