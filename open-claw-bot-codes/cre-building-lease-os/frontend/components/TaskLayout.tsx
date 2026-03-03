import Link from "next/link";
import React from "react";

type SummaryItem = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  testId?: string;
  valueTestId?: string;
};

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="card pageHeader">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="row">{action}</div> : null}
    </section>
  );
}

export function SummaryCards({ items }: { items: SummaryItem[] }) {
  return (
    <section className="summaryGrid">
      {items.map((item) => {
        const body = (
          <>
            <div className="label">{item.label}</div>
            <div className="value" data-testid={item.valueTestId}>{item.value}</div>
            {item.hint ? <div className="hint">{item.hint}</div> : null}
          </>
        );

        if (item.href) {
          return (
            <Link className="summaryCard summaryCardLink" key={item.label} href={item.href} data-testid={item.testId}>
              {body}
            </Link>
          );
        }

        return (
          <div className="summaryCard" key={item.label} data-testid={item.testId}>
            {body}
          </div>
        );
      })}
    </section>
  );
}

export function SectionBlock({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`card grid ${className || ""}`.trim()}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h2 className="cardTitle" style={{ marginBottom: 4 }}>
            {title}
          </h2>
          {description ? <p className="muted" style={{ margin: 0 }}>{description}</p> : null}
        </div>
        {action ? <div className="row">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatusChip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "active" | "draft" | "risk" | "info";
  children: React.ReactNode;
}) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="emptyState">
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="row">{action}</div> : null}
    </div>
  );
}
