import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import {
  detectHeaderRowIndex,
  extractStructuredCandidate,
  parseFloorLabel,
  parseWorkbook,
  toCsvRow,
} from "../lib/source-xlsx";

describe("source xlsx helpers", () => {
  it("detectHeaderRowIndex finds likely header row", () => {
    const rows = [
      ["宏盛國際金融中心 商戶明細"],
      ["地址"],
      ["樓層", "地址", "室號", "戶號", "商戶", "公司電話"],
      ["1F", "166號", "", "A3", "印尼人民銀行"],
    ];

    expect(detectHeaderRowIndex(rows)).toBe(2);
  });

  it("parseFloorLabel normalizes floor labels", () => {
    expect(parseFloorLabel("B2")).toBe("B2");
    expect(parseFloorLabel("3F A6-1")).toBe("3F");
    expect(parseFloorLabel("15")).toBe("15F");
    expect(parseFloorLabel("Lobby")).toBeNull();
  });

  it("extractStructuredCandidate maps key fields", () => {
    const candidate = extractStructuredCandidate({
      樓層: "3F",
      戶號: "A6-1",
      商戶: "日商丹下都市建築設計(股)公司台北辦事處",
      公司電話: "02-6608-9169",
      信件: "contact@example.com",
    });

    expect(candidate.floorLabel).toBe("3F");
    expect(candidate.unitCode).toBe("A6-1");
    expect(candidate.tenantName).toContain("日商丹下都市建築設計");
    expect(candidate.contactPhone).toContain("02-6608-9169");
    expect(candidate.contactEmail).toBe("contact@example.com");
  });

  it("toCsvRow escapes quotes and commas", () => {
    expect(toCsvRow(["A,B", '"C"'])).toBe('"A,B","""C"""');
  });

  it("parseWorkbook keeps rows with deduped columns", () => {
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["樓層", "戶號", "商戶", "分機", "分機"],
      ["1F", "A3", "印尼人民銀行", "100", "101"],
    ]);
    XLSX.utils.book_append_sheet(wb, sheet, "點交時間表");

    const parsed = parseWorkbook(wb);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].columns).toEqual(["樓層", "戶號", "商戶", "分機", "分機 (2)"]);
    expect(parsed[0].rows[0].rowObject["分機 (2)"]).toBe("101");
  });
});
