import { type ToasterToast } from "@/components/ui/toast";
import { type ReactNode } from "react";

export function createToast({
  id,
  open = true,
  onOpenChange,
  title,
  description,
  action,
  variant = "default",
  duration,
}: {
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "destructive" | "success" | "warning";
  duration?: number;
}): ToasterToast {
  return {
    id,
    title,
    open,
    onOpenChange,
    description,
    action,
    variant,
    duration,
  } as ToasterToast;
}
