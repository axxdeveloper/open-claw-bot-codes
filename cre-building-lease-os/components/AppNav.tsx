import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";
import { getCurrentUser } from "@/lib/auth";

export default async function AppNav() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 text-sm">
          <Link href="/buildings" className="font-semibold">
            CRE Lease OS
          </Link>
          <Link href="/buildings">大樓</Link>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>{user.email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
