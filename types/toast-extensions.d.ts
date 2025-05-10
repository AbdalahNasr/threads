import { ToasterToast, ToastProps } from "@/components/ui/toast"; // Adjust paths as needed
import { ReactNode, RefAttributes } from "react";

// Extend the ToasterToast type definition
declare module "@/components/ui/toast" { // Use your actual import path
  interface ToasterToast {
    title?: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    // Add any other properties you want to modify
  }
}