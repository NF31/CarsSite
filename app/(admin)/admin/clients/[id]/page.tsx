import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getClientByIdAction } from "@/actions/admin/clients";
import { ClientDetailsPageClient } from "./ClientDetailsPageClient";

export const revalidate = 0;

interface AdminClientDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminClientDetailsPage({
  params,
}: AdminClientDetailsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const result = await getClientByIdAction(id);

  if (!result.success || !result.data) {
    if (result.status === 404) {
      notFound();
    }

    const errorCode = result.status === 400 ? "client-invalid" : "client-unavailable";
    redirect(`/admin/clients?error=${errorCode}`);
  }

  return (
    <ClientDetailsPageClient
      client={result.data}
    />
  );
}


