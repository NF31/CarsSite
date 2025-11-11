import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function ClientBreadcrumbs({ items, className }: BreadcrumbsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn("flex items-center gap-1 text-sm text-muted-foreground", className)}
    >
      <ol className="flex items-center gap-1">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={isLast ? "page" : undefined}
                  className={cn(
                    "transition-colors",
                    isLast
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-foreground">{item.label}</span>
              )}
              {!isLast ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}


