import Link from "next/link";
import { EmptyState, PageHeader, SectionBlock } from "@/components/TaskLayout";

export default function ReportsPage() {
  return (
    <main className="page">
      <PageHeader
        title="報表與匯入（規劃中）"
        description="這裡會提供租約到期、空置率、修繕費用等報表，也會放置批次匯入工具。"
        action={<Link href="/buildings" className="btn secondary">回到 Dashboard</Link>}
      />

      <SectionBlock title="即將提供" description="先用目前功能完成核心流程，報表模組會接續加入。">
        <EmptyState
          title="報表模組準備中"
          description="短期可先用 Dashboard 與各頁摘要卡追蹤重點；需要細部資料時可在各功能頁查詢。"
          action={<Link href="/buildings" className="btn">前往營運總覽</Link>}
        />
      </SectionBlock>
    </main>
  );
}
