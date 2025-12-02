import { User } from "lucide-react";
import type { BookingListItem } from "../types";

interface BookingUserInfoProps {
  user: BookingListItem["user"];
  variant?: "mobile" | "desktop";
}

export function BookingUserInfo({ user, variant = "mobile" }: BookingUserInfoProps) {
  if (variant === "desktop") {
    return (
      <div className="align-top">
        <div className="font-medium text-gray-900">{user.name}</div>
        <div className="text-xs text-muted-foreground flex flex-col gap-0.5 break-words">
          {user.email && <span>{user.email}</span>}
          {user.phone && <span>{user.phone}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <User className="h-4 w-4 text-muted-foreground mt-1" />
      <div>
        <p className="font-semibold text-gray-900">{user.name}</p>
        <div className="text-xs text-muted-foreground space-x-2">
          {user.email && <span>{user.email}</span>}
          {user.phone && <span>{user.phone}</span>}
        </div>
      </div>
    </div>
  );
}

