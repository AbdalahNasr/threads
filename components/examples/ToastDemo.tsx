import React from "react";
import { Button } from "@/components/ui/button"; // Assuming this exists
import { ToastAction } from "@/components/ui/toast";
import { useCustomToast, directToast } from "@/components/Toast";

export function ToastDemo() {
  // Use our custom hook for type-safe toast creation
  const { toast } = useCustomToast();

  // Show simple toast with string content
  const handleSimpleToast = () => {
    toast({
      title: "Simple Toast",
      description: "This is a simple toast with string content",
      variant: "default",
      duration: 5000,
    });
  };

  // Show toast with action
  const handleToastWithAction = () => {
    toast({
      title: "Action Required",
      description: "This toast has an action button",
      variant: "destructive",
      action: (
        <ToastAction altText="Undo" onClick={() => console.log("Undo clicked")}>
          Undo
        </ToastAction>
      ),
    });
  };

  // Using direct toast (alternative approach)
  const handleDirectToast = () => {
    // This uses the original toast function directly
    directToast({
      title: "Direct Toast",
      description: "Using the direct toast method",
      variant: "default",
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Toast Demonstration</h2>

      <div className="flex flex-col space-y-2">
        <Button onClick={handleSimpleToast}>Show Simple Toast</Button>
        <Button onClick={handleToastWithAction} variant="destructive">
          Show Toast with Action
        </Button>
        <Button onClick={handleDirectToast} variant="outline">
          Show Direct Toast
        </Button>
      </div>
    </div>
  );
}
