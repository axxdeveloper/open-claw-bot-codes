"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";

type NavItem = { label: string; href: string; testId?: string };
type BuildingLite = { id: string; name: string };
type SearchHit = {
  id: string;
  type: "unit" | "tenant" | "lease" | "repair";
  label: string;
  subLabel: string;
  href: string;
  keywords: string;
};

function getBuildingId(pathname: string) {
  const m = pathname.match(/^\/buildings\/([^/]+)/);
  if (!m) return null;
  return m[1] === "new" ? null : m[1];
}

function isActive(pathname: string, href: string) {
  if (href === "/buildings") return pathname === "/buildings" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hitTypeLabel(type: SearchHit["type"]) {
  if (type === "unit") return "單位";
  if (type === "tenant") return "住戶";
  if (type === "lease") return "租約";
  return "修繕";
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  const [buildings, setBuildings] = useState<BuildingLite[]>([]);
  const [switcherId, setSwitcherId] = useState("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchHit[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  if (pathname === "/login") return null;

  const currentBuildingId = getBuildingId(pathname);

  const baseItems: NavItem[] = [
    { label: "Dashboard", href: "/buildings" },
    {
      label: "空間管理",
      href: currentBuildingId ? `/buildings/${currentBuildingId}/floors` : "/buildings",
    },
    {
      label: "客戶與合約",
      href: currentBuildingId ? `/buildings/${currentBuildingId}/tenants` : "/buildings",
    },
    {
      label: "維運管理",
      href: currentBuildingId ? `/buildings/${currentBuildingId}/repairs` : "/buildings",
    },
    { label: "收件匣", href: "/inbox", testId: "inbox-link" },
    { label: "報表/匯入", href: "/reports" },
  ];

  useEffect(() => {
    (async () => {
      const res = await apiFetch<BuildingLite[]>("/buildings");
      if (!res.ok) return;
      setBuildings(res.data);
    })();
  }, []);

  useEffect(() => {
    if (currentBuildingId) {
      setSwitcherId(currentBuildingId);
      return;
    }

    if (!switcherId && buildings.length > 0) {
      setSwitcherId(buildings[0].id);
    }
  }, [buildings, currentBuildingId, switcherId]);

  useEffect(() => {
    if (!switcherId) {
      setSearchIndex([]);
      return;
    }

    (async () => {
      setSearchLoading(true);
      const [floorsRes, tenantsRes, leasesRes, repairsRes] = await Promise.all([
        apiFetch<any[]>(`/buildings/${switcherId}/floors`),
        apiFetch<any[]>(`/buildings/${switcherId}/tenants`),
        apiFetch<any[]>(`/buildings/${switcherId}/leases`),
        apiFetch<any[]>(`/buildings/${switcherId}/repairs`),
      ]);

      const floorLabelById = new Map<string, string>();
      const unitHits: SearchHit[] = [];

      if (floorsRes.ok) {
        const detailRes = await Promise.all(
          floorsRes.data.map((f) => apiFetch<any>(`/floors/${f.id}`)),
        );

        detailRes.forEach((detail) => {
          if (!detail.ok) return;
          const floor = detail.data.floor;
          const units = detail.data.units || [];
          if (floor?.id && floor?.label) {
            floorLabelById.set(floor.id, floor.label);
          }

          units.forEach((u: any) => {
            const floorLabel = floor?.label || "未知樓層";
            unitHits.push({
              id: u.id,
              type: "unit",
              label: `${floorLabel}-${u.code}`,
              subLabel: `${floorLabel} 單位`,
              href: `/buildings/${switcherId}/floors/${floor?.id || ""}`,
              keywords: `${u.code} ${floorLabel} unit`,
            });
          });
        });
      }

      const tenantHits: SearchHit[] = tenantsRes.ok
        ? tenantsRes.data.map((t) => ({
            id: t.id,
            type: "tenant" as const,
            label: t.name,
            subLabel: `${t.contactName || "未填聯絡人"} / ${t.contactPhone || t.contactEmail || "未填聯絡方式"}`,
            href: `/buildings/${switcherId}/tenants`,
            keywords: `${t.name || ""} ${t.contactName || ""} ${t.contactPhone || ""} ${t.contactEmail || ""} tenant`,
          }))
        : [];

      const leaseHits: SearchHit[] = leasesRes.ok
        ? leasesRes.data.map((x: any) => ({
            id: x.lease.id,
            type: "lease" as const,
            label: `租約 ${String(x.lease.id).slice(0, 8)}`,
            subLabel: `${x.lease.status} / ${x.lease.startDate} ~ ${x.lease.endDate}`,
            href: `/leases/${x.lease.id}`,
            keywords: `${x.lease.id} ${x.lease.status} lease`,
          }))
        : [];

      const repairHits: SearchHit[] = repairsRes.ok
        ? repairsRes.data.map((r: any) => ({
            id: r.id,
            type: "repair" as const,
            label: r.item,
            subLabel: `${r.vendorName} / ${r.status}`,
            href: `/buildings/${switcherId}/repairs#repair-${r.id}`,
            keywords: `${r.item || ""} ${r.vendorName || ""} ${r.status || ""} ${floorLabelById.get(r.floorId || "") || ""} repair`,
          }))
        : [];

      setSearchIndex([...unitHits, ...tenantHits, ...leaseHits, ...repairHits]);
      setSearchLoading(false);
    })();
  }, [switcherId]);

  const filteredHits = useMemo(() => {
    const term = searchKeyword.trim().toLowerCase();
    if (!term) return [];

    return searchIndex
      .filter((x) => {
        const text = `${x.label} ${x.subLabel} ${x.keywords}`.toLowerCase();
        return text.includes(term);
      })
      .slice(0, 10);
  }, [searchIndex, searchKeyword]);

  return (
    <div className="nav">
      <div className="inner">
        <Link href="/buildings" className="navBrand" data-testid="nav-brand">
          CRE 物業租賃營運台
        </Link>

        <div className="navGroup">
          {baseItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              data-testid={item.testId}
              className={`navLink ${isActive(pathname, item.href) ? "navLinkActive" : ""}`.trim()}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="navTools">
          <label className="navSelectWrap" data-testid="building-switcher-wrap">
            <span className="navToolLabel">大樓切換</span>
            <select
              value={switcherId}
              data-testid="building-switcher"
              onChange={(e) => {
                const id = e.target.value;
                setSwitcherId(id);
                if (!id) return;
                router.push(`/buildings/${id}`);
              }}
            >
              <option value="">選擇大樓</option>
              {buildings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </label>

          <div className="navSearch" data-testid="global-search-wrap">
            <input
              value={searchKeyword}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setSearchOpen(true);
              }}
              placeholder={searchLoading ? "搜尋索引更新中..." : "全域搜尋：單位/住戶/租約/修繕"}
              aria-label="全域搜尋"
              data-testid="global-search-input"
            />
            {searchOpen && searchKeyword.trim() ? (
              <div className="searchPanel" data-testid="global-search-results">
                {filteredHits.length === 0 ? (
                  <div className="searchEmpty">找不到符合項目</div>
                ) : (
                  filteredHits.map((hit) => (
                    <button
                      key={`${hit.type}-${hit.id}`}
                      type="button"
                      className="searchItem"
                      data-testid={`global-search-hit-${hit.type}`}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchKeyword("");
                        router.push(hit.href);
                      }}
                    >
                      <span className="searchType">{hitTypeLabel(hit.type)}</span>
                      <span>
                        <b>{hit.label}</b>
                        <small>{hit.subLabel}</small>
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>

          <div className="quickAddWrap">
            <button
              type="button"
              className="secondary"
              data-testid="quick-add-button"
              onClick={() => setQuickAddOpen((x) => !x)}
            >
              快速新增
            </button>
            {quickAddOpen ? (
              <div className="quickAddMenu" data-testid="quick-add-menu">
                {currentBuildingId ? (
                  <>
                    <Link
                      href={`/buildings/${currentBuildingId}/tenants#quick-add-tenant`}
                      data-testid="quick-add-tenant"
                      onClick={() => setQuickAddOpen(false)}
                    >
                      新增住戶
                    </Link>
                    <Link
                      href={`/buildings/${currentBuildingId}/leases#quick-add-lease`}
                      data-testid="quick-add-lease"
                      onClick={() => setQuickAddOpen(false)}
                    >
                      新增租約
                    </Link>
                    <Link
                      href={`/buildings/${currentBuildingId}/repairs#quick-add-repair`}
                      data-testid="quick-add-repair"
                      onClick={() => setQuickAddOpen(false)}
                    >
                      新增修繕
                    </Link>
                    <Link
                      href={`/buildings/${currentBuildingId}/repairs#quick-add-vendor`}
                      data-testid="quick-add-vendor"
                      onClick={() => setQuickAddOpen(false)}
                    >
                      新增廠商
                    </Link>
                  </>
                ) : (
                  <span className="quickAddHint">請先切換到任一大樓</span>
                )}
              </div>
            ) : null}
          </div>

          <button
            className="secondary"
            onClick={() => {
              localStorage.removeItem("cre_logged_in");
              router.push("/login");
            }}
          >
            登出
          </button>
        </div>
      </div>
    </div>
  );
}
