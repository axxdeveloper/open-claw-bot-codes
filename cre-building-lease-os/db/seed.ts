import {
  AcceptanceResult,
  Prisma,
  RepairScopeType,
  RepairStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateFloorSpecs } from "../lib/domain";
import { prisma } from "../lib/prisma";

async function main() {
  const adminEmail = "admin@example.com";
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash("admin123", 10),
      },
    });
  }

  const building = await prisma.building.upsert({
    where: { code: "HSIFC" },
    update: {
      name: "宏盛國際金融中心",
      address: "台北市信義區（示例）",
      managementFee: new Prisma.Decimal(120.5),
    },
    create: {
      name: "宏盛國際金融中心",
      code: "HSIFC",
      address: "台北市信義區（示例）",
      managementFee: new Prisma.Decimal(120.5),
    },
  });

  const specs = generateFloorSpecs(5, 20);

  for (const spec of specs) {
    await prisma.floor.upsert({
      where: {
        buildingId_label: {
          buildingId: building.id,
          label: spec.label,
        },
      },
      update: {
        sortIndex: spec.sortIndex,
      },
      create: {
        buildingId: building.id,
        label: spec.label,
        sortIndex: spec.sortIndex,
      },
    });
  }

  const targetLabels = ["5F", "6F", "9F", "10F"];
  const unitCodes = ["A1", "A2", "A3", "A4", "A5", "A6", "A6-1"];

  for (const label of targetLabels) {
    const floor = await prisma.floor.findUniqueOrThrow({
      where: {
        buildingId_label: {
          buildingId: building.id,
          label,
        },
      },
    });

    for (const [idx, code] of unitCodes.entries()) {
      await prisma.unit.upsert({
        where: {
          floorId_code_isCurrent: {
            floorId: floor.id,
            code,
            isCurrent: true,
          },
        },
        update: {},
        create: {
          buildingId: building.id,
          floorId: floor.id,
          code,
          grossArea: new Prisma.Decimal(80 + idx * 5),
          netArea: new Prisma.Decimal(60 + idx * 4),
          balconyArea: new Prisma.Decimal(5),
        },
      });
    }
  }

  const floorMap = new Map<string, string>();
  for (const label of ["B2", "B1", "1F", "5F", "9F", "10F"]) {
    const floor = await prisma.floor.findUniqueOrThrow({
      where: {
        buildingId_label: {
          buildingId: building.id,
          label,
        },
      },
    });
    floorMap.set(label, floor.id);
  }

  await prisma.repairRecord.deleteMany({ where: { buildingId: building.id } });
  await prisma.floorOwner.deleteMany({ where: { floor: { buildingId: building.id } } });
  await prisma.owner.deleteMany({ where: { buildingId: building.id } });
  await prisma.vendor.deleteMany({ where: { buildingId: building.id } });
  await prisma.commonArea.deleteMany({ where: { buildingId: building.id } });

  const owners = await Promise.all([
    prisma.owner.create({
      data: {
        buildingId: building.id,
        name: "宏盛資產管理股份有限公司",
        taxId: "12345678",
        contactName: "王經理",
        contactPhone: "02-2712-1000",
        contactEmail: "owner1@example.com",
        notes: "主業主",
      },
    }),
    prisma.owner.create({
      data: {
        buildingId: building.id,
        name: "宏盛開發投資股份有限公司",
        taxId: "87654321",
        contactName: "陳協理",
        contactPhone: "02-2712-2000",
        contactEmail: "owner2@example.com",
      },
    }),
  ]);

  await prisma.floorOwner.createMany({
    data: [
      {
        floorId: floorMap.get("5F")!,
        ownerId: owners[0].id,
        sharePercent: new Prisma.Decimal(60),
        notes: "5F 持分",
      },
      {
        floorId: floorMap.get("9F")!,
        ownerId: owners[1].id,
        sharePercent: new Prisma.Decimal(100),
        notes: "9F 持分",
      },
      {
        floorId: floorMap.get("10F")!,
        ownerId: owners[0].id,
        sharePercent: new Prisma.Decimal(40),
        notes: "10F 持分",
      },
    ],
  });

  const [lobby, elevator, parkingB2, machineRoom, corridor] = await Promise.all([
    prisma.commonArea.create({
      data: {
        buildingId: building.id,
        floorId: floorMap.get("1F")!,
        name: "大廳",
        code: "LOBBY-1F",
        description: "一樓接待與等候區",
      },
    }),
    prisma.commonArea.create({
      data: {
        buildingId: building.id,
        name: "電梯",
        code: "ELEVATOR",
      },
    }),
    prisma.commonArea.create({
      data: {
        buildingId: building.id,
        floorId: floorMap.get("B2")!,
        name: "停車場",
        code: "PARKING-B2",
      },
    }),
    prisma.commonArea.create({
      data: {
        buildingId: building.id,
        floorId: floorMap.get("B1")!,
        name: "機房",
        code: "MACHINE-ROOM",
      },
    }),
    prisma.commonArea.create({
      data: {
        buildingId: building.id,
        name: "公共走廊",
        code: "PUBLIC-CORRIDOR",
      },
    }),
  ]);

  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        buildingId: building.id,
        name: "全方位機電工程",
        contactName: "林先生",
        contactPhone: "02-2777-1000",
      },
    }),
    prisma.vendor.create({
      data: {
        buildingId: building.id,
        name: "大都會室內修繕",
        contactName: "張小姐",
        contactPhone: "02-2777-2000",
      },
    }),
  ]);

  await prisma.repairRecord.create({
    data: {
      buildingId: building.id,
      scopeType: RepairScopeType.FLOOR,
      floorId: floorMap.get("10F")!,
      item: "10F 空調主機更換",
      description: "更換冷媒管線與壓縮機",
      vendorId: vendors[0].id,
      vendorName: vendors[0].name,
      quoteAmount: new Prisma.Decimal(480000),
      status: RepairStatus.QUOTED,
      notes: "待董事會核准",
    },
  });

  await prisma.repairRecord.create({
    data: {
      buildingId: building.id,
      scopeType: RepairScopeType.COMMON_AREA,
      commonAreaId: lobby.id,
      item: "一樓大廳地坪修復",
      description: "石材破損修復與拋光",
      vendorId: vendors[1].id,
      vendorName: vendors[1].name,
      quoteAmount: new Prisma.Decimal(160000),
      approvedAmount: new Prisma.Decimal(150000),
      status: RepairStatus.ACCEPTED,
      acceptanceResult: AcceptanceResult.PASS,
      inspectorName: "李主任",
      acceptedAt: new Date(),
      notes: "已驗收完成",
    },
  });

  console.log(
    "Seed completed:",
    building.name,
    owners.length,
    elevator.name,
    parkingB2.name,
    machineRoom.name,
    corridor.name,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
