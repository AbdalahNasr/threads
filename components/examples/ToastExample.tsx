import React from "react";
import { useToast, ToastAction } from "@/components/ui/toast";
import { Button } from "@/components/ui/button"; // Assuming you have this component
import { createToast } from "../ui/toast-adapter";

export function ToastExample() {
  const { toast } = useToast();

  const handleShowToast = () => {
    // Option 1: Using the adapter to handle ReactNode to string conversion
    const toastData = createToast({
      id: "example-toast",
      open: true,
      onOpenChange: (open) => {
        console.log("Toast state changed:", open);
      },
      title: "Success!",
      description: "Your action was completed successfully.",
      action: (
        <ToastAction
          altText="Try again"
          onClick={() => console.log("Action clicked")}
        >
          Try again
        </ToastAction>
      ),
      variant: "default",
      duration: 5000,
    });

    // Pass the converted toast to the toast function
    toast(toastData);

    // Option 2: Direct usage without adapter - make sure types match
    // Use this approach if you're not using React elements in title/description
    toast({
      title: "Direct Toast",
      description: "This toast doesn't use the adapter",
      action: (
        <ToastAction altText="Dismiss" onClick={() => console.log("Dismissed")}>
          Dismiss
        </ToastAction>
      ),
      variant: "destructive",
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Toast Example</h2>
      <Button onClick={handleShowToast}>Show Toast Notifications</Button>
    </div>
  );
}
