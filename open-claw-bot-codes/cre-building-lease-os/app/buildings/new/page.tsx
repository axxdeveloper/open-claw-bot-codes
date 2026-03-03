import { requireUser } from "@/lib/auth";
import CreateBuildingForm from "@/components/CreateBuildingForm";

export default async function NewBuildingPage() {
  await requireUser();
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">建立新大樓</h1>
      <CreateBuildingForm />
    </main>
  );
}
