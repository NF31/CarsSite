interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-md p-3">
      {message}
    </p>
  );
}

