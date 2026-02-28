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
        <Link href="/buildings"><b>CRE Lease OS</b></Link>
        <Link href="/buildings">Buildings</Link>
        <button
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
