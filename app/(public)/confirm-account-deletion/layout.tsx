import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Confirmation de suppression - CarRental",
  description: "Confirmez la suppression de votre compte",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmAccountDeletionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

