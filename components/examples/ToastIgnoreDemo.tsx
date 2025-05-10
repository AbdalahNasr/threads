import React from "react";
import { Button } from "@/components/ui/button"; // Assuming this exists
import { ToastAction } from "@/components/ui/toast";
import {  createToast } from "@/components/Toast";

export function ToastIgnoreDemo() {
  // Using the custom hook
  const { toast } = useCustomToast();

  // Basic toast with React elements (works with @ts-ignore)
  const handleReactElementToast = () => {
    toast({
      title: <span className="font-bold">React Element Title</span>,
      description: (
        <p>This toast contains React elements in the title and description</p>
      ),
      variant: "default",
      duration: 5000,
    });
  };

  // Using the custom toast with action
  const handleActionToast = () => {
    toast({
      title: "Action Toast",
      description: "This toast has an action button",
      action: (
        <ToastAction
          altText="Undo"
          onClick={() => console.log("Action clicked")}
        >
          Undo
        </ToastAction>
      ),
      variant: "destructive",
    });
  };

  // Using direct showToast function
  const handleDirectToast = () => {
    showToast({
      title: "Direct Toast",
      description: "Using the direct toast wrapper",
      variant: "default",
    });
  };

  // Using createToast for complete control
  const handleCreateToast = () => {
    const toastData = createToast({
      id: "custom-id-" + Date.now(),
      open: true,
      onOpenChange: (open) => console.log("Toast state changed:", open),
      title: "Custom Toast",
      description: "With all configuration options",
      variant: "default",
      duration: 3000,
    });

    // Now you can use toastData if needed
      // @ts-ignore - Suppressing incompatible types error
    console.log("Created toast with ID:", toastData.id);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Toast Demonstrations</h2>

      <div className="flex flex-col space-y-2">
        <Button onClick={handleReactElementToast}>
          Toast with React Elements
        </Button>

        <Button onClick={handleActionToast} variant="destructive">
          Toast with Action
        </Button>

        <Button onClick={handleDirectToast} variant="outline">
          Direct Toast Call
        </Button>

        <Button onClick={handleCreateToast} variant="secondary">
          Create Custom Toast
        </Button>
      </div>
    </div>
  );
}
