// Layout sans metadata - les metadata sont gérées dans page.tsx via generateMetadata
// pour éviter les conflits entre layout metadata et generateMetadata
export default function VehiclesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

