import { memo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface RememberMeCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const RememberMeCheckbox = memo(function RememberMeCheckbox({
  checked,
  onCheckedChange,
}: RememberMeCheckboxProps) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="rememberMe"
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
        className="h-4 w-4 sm:h-5 sm:w-5"
      />
      <Label
        htmlFor="rememberMe"
        className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Se souvenir de moi
      </Label>
    </div>
  );
});

