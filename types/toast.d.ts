import { ToasterToast, ToastProps } from "your-toast-library"; // Update with actual import path
import { ReactNode, RefAttributes } from "react";
import { VariantProps, ConfigVariants, ClassProp } from "your-variant-library"; // Update with actual import path

// Extend the ToasterToast type to accept ReactNode
declare module "your-toast-library" {
  interface ToasterToast extends Omit<
    Omit<ToastProps & RefAttributes<HTMLLIElement>, "ref"> & 
    VariantProps<(props?: (ConfigVariants<{ variant: { default: string; destructive: string; }; }> & ClassProp) | undefined) => string> & 
    RefAttributes<HTMLLIElement>, 
    "ref"
  > {
    title?: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
  }
}