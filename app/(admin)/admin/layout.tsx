// Tout l'espace admin lit la base à chaque requête : aucune page ne doit être
// prérendue au build (données figées, et données clients dans le HTML généré)
export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
