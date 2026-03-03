import Link from "next/link";

export default function ManageEntryCta({
  buildingId,
  hint,
}: {
  buildingId: string;
  hint?: string;
}) {
  return (
    <div className="rounded border border-dashed bg-white p-3 text-sm">
      <div className="font-medium">需要新增或編輯資料？</div>
      <p className="mt-1 text-xs text-gray-500">{hint ?? "請改由資料維護區操作，主要頁面保留查詢視角。"}</p>
      <Link
        href={`/buildings/${buildingId}/manage`}
        className="mt-2 inline-flex rounded border px-3 py-1.5 text-xs hover:bg-gray-50"
      >
        進入資料維護
      </Link>
    </div>
  );
}
