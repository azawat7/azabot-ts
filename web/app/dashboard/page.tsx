import { SessionManager } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import Dashboard from "./Dashboard";

export default async function DashboardPage() {
  const session = await SessionManager.getSession();

  if (!session) {
    redirect("/");
  }

  return <Dashboard />;
}
