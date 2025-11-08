import { notFound, redirect } from "next/navigation";
import {
  getServiceByIdAction,
} from "@/actions/admin/services";
import { ServiceForm } from "@/components/admin/services/ServiceForm";

interface AdminEditServicePageProps {
  params: {
    id: string;
  };
}

export default async function AdminEditServicePage({
  params,
}: AdminEditServicePageProps) {
  const resolvedParams = await params;
  const rawId = resolvedParams?.id;
  const serviceId = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim?.() ?? "";

  if (!serviceId) {
    redirect("/admin/services?error=invalid-service");
  }

  const result = await getServiceByIdAction(serviceId);

  if (!result.success || !result.data) {
    if (result?.status === 404) {
      notFound();
    }

    if (result?.status === 403) {
      redirect("/admin/services");
    }

    if (result?.status === 400) {
      redirect("/admin/services?error=invalid-service");
    }

    throw new Error(result?.error ?? "Une erreur est survenue lors du chargement du service.");
  }

  return <ServiceForm mode="edit" service={result.data} />;
}


