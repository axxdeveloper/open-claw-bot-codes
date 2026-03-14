-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."LeaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "public"."OccupancyStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "public"."FileKind" AS ENUM ('CONTRACT', 'FLOORPLAN', 'IMAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."RepairScopeType" AS ENUM ('FLOOR', 'COMMON_AREA');

-- CreateEnum
CREATE TYPE "public"."RepairStatus" AS ENUM ('DRAFT', 'QUOTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."AcceptanceResult" AS ENUM ('PASS', 'FAIL', 'CONDITIONAL');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "address" TEXT,
    "managementFee" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Floor" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortIndex" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Unit" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "grossArea" DECIMAL(10,2) NOT NULL,
    "netArea" DECIMAL(10,2),
    "balconyArea" DECIMAL(10,2),
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "replacedAt" TIMESTAMP(3),
    "replacedByUnitId" TEXT,
    "sourceUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Owner" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FloorOwner" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "sharePercent" DECIMAL(5,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FloorOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Occupancy" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT,
    "status" "public"."OccupancyStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Occupancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lease" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "public"."LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "managementFee" DECIMAL(12,2),
    "rent" DECIMAL(12,2),
    "deposit" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaseUnit" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Vendor" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CommonArea" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorId" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommonArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RepairRecord" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "scopeType" "public"."RepairScopeType" NOT NULL,
    "floorId" TEXT,
    "commonAreaId" TEXT,
    "item" TEXT NOT NULL,
    "description" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT NOT NULL,
    "quoteAmount" DECIMAL(12,2) NOT NULL,
    "approvedAmount" DECIMAL(12,2),
    "status" "public"."RepairStatus" NOT NULL DEFAULT 'DRAFT',
    "acceptanceResult" "public"."AcceptanceResult",
    "inspectorName" TEXT,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RepairRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuildingFile" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "kind" "public"."FileKind" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuildingFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FloorFile" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "kind" "public"."FileKind" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FloorFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaseAttachment" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "kind" "public"."FileKind" NOT NULL DEFAULT 'CONTRACT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RepairAttachment" (
    "id" TEXT NOT NULL,
    "repairId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RepairAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "public"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "public"."Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Building_code_key" ON "public"."Building"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_buildingId_label_key" ON "public"."Floor"("buildingId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Floor_buildingId_sortIndex_key" ON "public"."Floor"("buildingId", "sortIndex");

-- CreateIndex
CREATE INDEX "Unit_buildingId_floorId_isCurrent_idx" ON "public"."Unit"("buildingId", "floorId", "isCurrent");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_floorId_code_isCurrent_key" ON "public"."Unit"("floorId", "code", "isCurrent");

-- CreateIndex
CREATE INDEX "Tenant_buildingId_name_idx" ON "public"."Tenant"("buildingId", "name");

-- CreateIndex
CREATE INDEX "Owner_buildingId_name_idx" ON "public"."Owner"("buildingId", "name");

-- CreateIndex
CREATE INDEX "FloorOwner_floorId_startDate_idx" ON "public"."FloorOwner"("floorId", "startDate");

-- CreateIndex
CREATE INDEX "FloorOwner_ownerId_startDate_idx" ON "public"."FloorOwner"("ownerId", "startDate");

-- CreateIndex
CREATE INDEX "Occupancy_unitId_status_idx" ON "public"."Occupancy"("unitId", "status");

-- CreateIndex
CREATE INDEX "Occupancy_tenantId_status_idx" ON "public"."Occupancy"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Lease_buildingId_status_idx" ON "public"."Lease"("buildingId", "status");

-- CreateIndex
CREATE INDEX "Lease_tenantId_status_idx" ON "public"."Lease"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LeaseUnit_unitId_idx" ON "public"."LeaseUnit"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaseUnit_leaseId_unitId_key" ON "public"."LeaseUnit"("leaseId", "unitId");

-- CreateIndex
CREATE INDEX "Vendor_buildingId_name_idx" ON "public"."Vendor"("buildingId", "name");

-- CreateIndex
CREATE INDEX "CommonArea_buildingId_name_idx" ON "public"."CommonArea"("buildingId", "name");

-- CreateIndex
CREATE INDEX "CommonArea_floorId_idx" ON "public"."CommonArea"("floorId");

-- CreateIndex
CREATE INDEX "RepairRecord_buildingId_status_scopeType_idx" ON "public"."RepairRecord"("buildingId", "status", "scopeType");

-- CreateIndex
CREATE INDEX "RepairRecord_floorId_idx" ON "public"."RepairRecord"("floorId");

-- CreateIndex
CREATE INDEX "RepairRecord_commonAreaId_idx" ON "public"."RepairRecord"("commonAreaId");

-- CreateIndex
CREATE INDEX "BuildingFile_buildingId_idx" ON "public"."BuildingFile"("buildingId");

-- CreateIndex
CREATE INDEX "FloorFile_floorId_idx" ON "public"."FloorFile"("floorId");

-- CreateIndex
CREATE INDEX "LeaseAttachment_leaseId_idx" ON "public"."LeaseAttachment"("leaseId");

-- CreateIndex
CREATE INDEX "RepairAttachment_repairId_idx" ON "public"."RepairAttachment"("repairId");

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Floor" ADD CONSTRAINT "Floor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "public"."Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_replacedByUnitId_fkey" FOREIGN KEY ("replacedByUnitId") REFERENCES "public"."Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Unit" ADD CONSTRAINT "Unit_sourceUnitId_fkey" FOREIGN KEY ("sourceUnitId") REFERENCES "public"."Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Owner" ADD CONSTRAINT "Owner_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FloorOwner" ADD CONSTRAINT "FloorOwner_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "public"."Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FloorOwner" ADD CONSTRAINT "FloorOwner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Occupancy" ADD CONSTRAINT "Occupancy_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Occupancy" ADD CONSTRAINT "Occupancy_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Occupancy" ADD CONSTRAINT "Occupancy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Occupancy" ADD CONSTRAINT "Occupancy_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaseUnit" ADD CONSTRAINT "LeaseUnit_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaseUnit" ADD CONSTRAINT "LeaseUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "public"."Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Vendor" ADD CONSTRAINT "Vendor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommonArea" ADD CONSTRAINT "CommonArea_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CommonArea" ADD CONSTRAINT "CommonArea_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "public"."Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepairRecord" ADD CONSTRAINT "RepairRecord_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepairRecord" ADD CONSTRAINT "RepairRecord_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "public"."Floor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepairRecord" ADD CONSTRAINT "RepairRecord_commonAreaId_fkey" FOREIGN KEY ("commonAreaId") REFERENCES "public"."CommonArea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepairRecord" ADD CONSTRAINT "RepairRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuildingFile" ADD CONSTRAINT "BuildingFile_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "public"."Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FloorFile" ADD CONSTRAINT "FloorFile_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "public"."Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaseAttachment" ADD CONSTRAINT "LeaseAttachment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RepairAttachment" ADD CONSTRAINT "RepairAttachment_repairId_fkey" FOREIGN KEY ("repairId") REFERENCES "public"."RepairRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

