"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/login") return null;

  return (
    <div className="nav">
      <div className="inner">
        <Link href="/buildings" className="navBrand">
          宏泰風格商辦租賃台
        </Link>
        <Link href="/buildings">Buildings</Link>
        <button
          className="secondary"
          onClick={() => {
            localStorage.removeItem("cre_logged_in");
            router.push("/login");
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
