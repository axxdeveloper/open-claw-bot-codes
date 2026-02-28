"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type NavItem = { label: string; href: string };

function getBuildingId(pathname: string) {
  const m = pathname.match(/^\/buildings\/([^/]+)/);
  if (!m) return null;
  return m[1] === "new" ? null : m[1];
}

function isActive(pathname: string, href: string) {
  if (href === "/buildings") return pathname === "/buildings" || pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

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
    { label: "報表/匯入", href: "/reports" },
  ];

  return (
    <div className="nav">
      <div className="inner">
        <Link href="/buildings" className="navBrand">
          CRE 物業租賃營運台
        </Link>

        <div className="navGroup">
          {baseItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`navLink ${isActive(pathname, item.href) ? "navLinkActive" : ""}`.trim()}
            >
              {item.label}
            </Link>
          ))}
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
  );
}
