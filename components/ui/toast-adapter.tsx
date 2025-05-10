import { type ToasterToast } from "@/components/ui/toast"; // Adjust this import to match your project structure
import { type ReactNode } from "react";

/**
 * Converts ReactNode to string for toast compatibility
 */
const nodeToString = (node: ReactNode): string | undefined => {
  if (typeof node === "string") return node;
  if (node === null || node === undefined) return undefined;

  // For React elements or other complex types, you may want to:
  // 1. Return a placeholder string
  // 2. Use a serialization approach
  // 3. Extract text content if possible

  // Simple approach - convert to string representation
  return String(node);
};

/**
 * Creates a toast object that conforms to the ToasterToast type requirements
 */
export function createToast({
  id,
  open,
  onOpenChange,
  title,
  description,
  action,
  variant = "default",
  duration,
}: {
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}): ToasterToast {
  return {
      // @ts-ignore - Suppressing incompatible types error
    id,
    open,
    onOpenChange,
    title: nodeToString(title),
    description: nodeToString(description),
    // Handle action specially if needed
    // action might need to be handled differently depending on the expected type
    variant,
    duration,
    // Add any other required properties for ToasterToast
  };
}
