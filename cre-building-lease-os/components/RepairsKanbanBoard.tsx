"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CreateRepairForm from "@/components/CreateRepairForm";
import CreateVendorForm from "@/components/CreateVendorForm";

type VendorLite = { id: string; name: string };
type FloorLite = { id: string; label: string };
type CommonAreaLite = { id: string; name: string };

type RepairCard = {
  id: string;
  item: string;
  description: string | null;
  status: string;
  vendorId: string | null;
  vendorName: string;
  quoteAmount: number;
  approvedAmount: number | null;
  finalAmount: number | null;
  reportedAt: string;
  createdAt: string;
  floor: { id: string; label: string } | null;
  commonArea: { id: string; name: string } | null;
  repairAttachments: { id: string; fileUrl: string; fileName: string }[];
};

const statusLabel: Record<string, string> = {
  DRAFT: "新建",
  QUOTED: "待處理",
  APPROVED: "已核准",
  IN_PROGRESS: "施工中",
  COMPLETED: "已完工",
  ACCEPTED: "已驗收",
  REJECTED: "已退回",
};

type TabKey = "board" | "history" | "vendors";

function getColumnKey(status: string): "new" | "progress" | "done" {
  if (["APPROVED", "IN_PROGRESS"].includes(status)) return "progress";
  if (["COMPLETED", "ACCEPTED"].includes(status)) return "done";
  return "new";
}

function derivePriority(repair: RepairCard): "HIGH" | "MEDIUM" | "LOW" {
  const amount = repair.approvedAmount ?? repair.finalAmount ?? repair.quoteAmount ?? 0;
  if (repair.status === "REJECTED" || amount >= 100000) return "HIGH";
  if (["APPROVED", "IN_PROGRESS", "COMPLETED"].includes(repair.status) || amount >= 30000) return "MEDIUM";
  return "LOW";
}

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url);
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function RepairsKanbanBoard({
  buildingId,
  buildingName,
  repairs,
  vendors,
  floors,
  commonAreas,
}: {
  buildingId: string;
  buildingName: string;
  repairs: RepairCard[];
  vendors: VendorLite[];
  floors: FloorLite[];
  commonAreas: CommonAreaLite[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("board");
  const [selectedId, setSelectedId] = useState<string | null>(repairs[0]?.id ?? null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorDraft, setVendorDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(repairs.map((item) => [item.id, item.vendorId ?? ""])),
  );

  const grouped = useMemo(() => {
    const result: Record<"new" | "progress" | "done", RepairCard[]> = {
      new: [],
      progress: [],
      done: [],
    };
    repairs.forEach((repair) => {
      result[getColumnKey(repair.status)].push(repair);
    });
    return result;
  }, [repairs]);

  const selected = repairs.find((item) => item.id === selectedId) ?? null;

  async function assignVendor(repair: RepairCard) {
    const vendorId = vendorDraft[repair.id] || null;
    const vendor = vendors.find((item) => item.id === vendorId);
    setAssigningId(repair.id);
    setError(null);
    try {
      const res = await fetch(`/api/repairs/${repair.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          vendorName: vendor?.name ?? repair.vendorName,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? "更新廠商失敗");
        return;
      }
      router.refresh();
    } finally {
      setAssigningId(null);
    }
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "board", label: "看板檢視" },
    { key: "history", label: "維修歷程" },
    { key: "vendors", label: "廠商" },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-gray-500">維護與修繕</p>
            <h1 className="text-2xl font-semibold">{buildingName} 維修管理</h1>
          </div>
          <button
            onClick={() => {
              setTab("board");
              setIsCreateOpen((v) => !v);
            }}
            className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white"
          >
            新增工單
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((item) => (
            <button
              key={item.key}
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === item.key ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "board" && (
        <>
          {isCreateOpen && (
            <section className="rounded-xl border bg-white p-4 shadow-sm">
              <CreateRepairForm
                buildingId={buildingId}
                floors={floors}
                commonAreas={commonAreas}
                vendors={vendors}
              />
            </section>
          )}

          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_360px]">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { key: "new" as const, title: "新建 / 待處理" },
                { key: "progress" as const, title: "處理中" },
                { key: "done" as const, title: "已完成" },
              ].map((column) => (
                <div key={column.key} className="rounded-xl border bg-gray-50 p-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{column.title}</h3>
                    <span className="text-xs text-gray-500">{grouped[column.key].length}</span>
                  </div>
                  <div className="space-y-3">
                    {grouped[column.key].map((repair) => {
                      const priority = derivePriority(repair);
                      const thumb = repair.repairAttachments.find((a) => isImage(a.fileUrl));
                      return (
                        <article
                          key={repair.id}
                          className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm ${
                            selectedId === repair.id ? "border-blue-500" : "border-gray-200"
                          }`}
                          onClick={() => setSelectedId(repair.id)}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                priority === "HIGH"
                                  ? "bg-red-100 text-red-700"
                                  : priority === "MEDIUM"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {priority}
                            </span>
                            <span className="text-xs text-gray-500">#{repair.id.slice(-6)}</span>
                          </div>
                          <p className="text-sm font-semibold">{repair.item || "未命名工單"}</p>
                          <p className="mt-1 text-xs text-gray-600">
                            {buildingName} / {repair.floor?.label || repair.commonArea?.name || "未設定位置"}
                          </p>
                          {thumb && (
                            <img
                              src={thumb.fileUrl}
                              alt={thumb.fileName}
                              className="mt-2 h-20 w-full rounded object-cover"
                            />
                          )}
                          <div className="mt-2 flex gap-2">
                            <select
                              value={vendorDraft[repair.id] ?? ""}
                              className="min-w-0 flex-1 rounded border px-2 py-1 text-xs"
                              onChange={(e) =>
                                setVendorDraft((prev) => ({ ...prev, [repair.id]: e.target.value }))
                              }
                            >
                              <option value="">選擇廠商</option>
                              {vendors.map((vendor) => (
                                <option key={vendor.id} value={vendor.id}>
                                  {vendor.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              disabled={assigningId === repair.id}
                              className="rounded border px-2 py-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                void assignVendor(repair);
                              }}
                            >
                              指派
                            </button>
                          </div>
                        </article>
                      );
                    })}
                    {grouped[column.key].length === 0 && (
                      <div className="rounded-lg border border-dashed p-3 text-xs text-gray-500">目前沒有工單</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-xl border bg-white p-4 shadow-sm">
              {selected ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">工單 #{selected.id.slice(-6)}</p>
                    <h2 className="text-lg font-semibold">{selected.item || "未命名工單"}</h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {statusLabel[selected.status] || selected.status}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {derivePriority(selected)}
                    </span>
                  </div>

                  <section>
                    <h3 className="text-sm font-medium">問題描述</h3>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {selected.description || "尚未提供描述"}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-medium">位置</h3>
                    <p className="mt-1 text-sm text-gray-700">{buildingName}</p>
                    <p className="text-sm text-gray-600">
                      {selected.floor?.label || selected.commonArea?.name || "未設定樓層/公共區域"}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-sm font-medium">通報時間</h3>
                    <p className="mt-1 text-sm text-gray-700">{formatDate(selected.reportedAt || selected.createdAt)}</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-medium">附件</h3>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {selected.repairAttachments.length > 0 ? (
                        selected.repairAttachments.map((file) => (
                          <a key={file.id} href={file.fileUrl} target="_blank" rel="noreferrer" className="block">
                            {isImage(file.fileUrl) ? (
                              <img
                                src={file.fileUrl}
                                alt={file.fileName}
                                className="h-16 w-full rounded border object-cover"
                              />
                            ) : (
                              <div className="flex h-16 items-center justify-center rounded border text-xs text-gray-600">
                                {file.fileName}
                              </div>
                            )}
                          </a>
                        ))
                      ) : (
                        <p className="col-span-3 text-xs text-gray-500">無附件</p>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className="mb-1 text-sm font-medium">指派廠商</h3>
                    <div className="flex gap-2">
                      <select
                        value={vendorDraft[selected.id] ?? ""}
                        className="min-w-0 flex-1 rounded border px-2 py-1 text-sm"
                        onChange={(e) =>
                          setVendorDraft((prev) => ({ ...prev, [selected.id]: e.target.value }))
                        }
                      >
                        <option value="">選擇廠商</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded bg-black px-3 py-1 text-sm text-white"
                        disabled={assigningId === selected.id}
                        onClick={() => void assignVendor(selected)}
                      >
                        更新
                      </button>
                    </div>
                  </section>

                  {error && <p className="text-xs text-red-600">{error}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500">請先選擇一筆工單查看細節</p>
              )}
            </aside>
          </section>
        </>
      )}

      {tab === "history" && (
        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold">維修歷程</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500">
                  <th className="pb-2 pr-3">工單</th>
                  <th className="pb-2 pr-3">項目</th>
                  <th className="pb-2 pr-3">地點</th>
                  <th className="pb-2 pr-3">廠商</th>
                  <th className="pb-2 pr-3">狀態</th>
                  <th className="pb-2">通報時間</th>
                </tr>
              </thead>
              <tbody>
                {repairs.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 pr-3 text-xs text-gray-500">#{item.id.slice(-6)}</td>
                    <td className="py-2 pr-3">{item.item}</td>
                    <td className="py-2 pr-3">{item.floor?.label || item.commonArea?.name || "-"}</td>
                    <td className="py-2 pr-3">{item.vendorName || "-"}</td>
                    <td className="py-2 pr-3">{statusLabel[item.status] || item.status}</td>
                    <td className="py-2">{formatDate(item.reportedAt || item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "vendors" && (
        <section className="space-y-4 rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">廠商</h2>
          <CreateVendorForm buildingId={buildingId} />
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <li key={vendor.id} className="rounded border bg-gray-50 p-3 text-sm">
                {vendor.name}
              </li>
            ))}
            {vendors.length === 0 && <li className="text-sm text-gray-500">目前無廠商資料</li>}
          </ul>
        </section>
      )}
    </div>
  );
}
