import { memo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form";

interface PasswordInputProps {
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PasswordInput = memo(function PasswordInput({
  showPassword,
  onTogglePassword,
  disabled,
  value,
  onChange,
}: PasswordInputProps) {
  return (
    <div className="relative">
      <FormControl>
        <Input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          disabled={disabled}
          value={value}
          onChange={onChange}
          className="pr-14 sm:pr-16 h-10 sm:h-11 text-sm sm:text-base transition-all duration-200 border-gray-300 focus:border-primary focus:ring-primary"
        />
      </FormControl>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onTogglePassword}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 h-11 w-11 p-2"
        aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
        )}
      </Button>
    </div>
  );
});

