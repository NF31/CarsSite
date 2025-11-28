import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth/login";

export function useLoginSubmit() {
  const router = useRouter();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);
    setError(null);

    try {
      // Utiliser la Server Action pour le rate limiting et verrouillage
      const result = await loginAction({
        email: data.email,
        password: data.password,
        rememberMe,
      });

      if (!result.success) {
        // Gérer les erreurs de rate limiting
        if (result.status === 429) {
          setError(result.error || "Trop de tentatives. Veuillez réessayer dans quelques instants.");
        } else if (result.status === 423) {
          // Compte verrouillé
          setError(result.error || "Compte temporairement verrouillé. Veuillez réessayer plus tard.");
        } else {
          // Message d'erreur générique pour éviter la fuite d'information
          setError(result.error || "Identifiants incorrects");
        }
        return;
      }

      // Si la connexion réussit, attendre un peu pour que la session soit mise à jour
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      // Récupérer le rôle depuis la session pour rediriger correctement
      const sessionResponse = await fetch("/api/auth/session");
      const session = await sessionResponse.json();
      const role = session?.user?.role;
      
      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return {
    form,
    rememberMe,
    setRememberMe,
    isLoading,
    error,
    onSubmit,
  };
}

