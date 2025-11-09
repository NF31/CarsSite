import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientByIdAction } from "@/actions/admin/clients";
import { ClientEditForm } from "@/components/admin/clients/ClientEditForm";

interface AdminClientEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientEditPage({ params }: AdminClientEditPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const clientId = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim?.() ?? "";

  if (!clientId) {
    redirect("/admin/clients?error=client-invalid");
  }

  const result = await getClientByIdAction(clientId);

  if (!result.success || !result.data) {
    if (result.status === 404) {
      notFound();
    }

    const errorCode =
      result.status === 400 ? "client-invalid" : "client-unavailable";
    redirect(`/admin/clients?error=${errorCode}`);
  }

  return <ClientEditForm client={result.data} />;
}



