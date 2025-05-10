import { useToast } from "@/components/ui/use-toast"; // Adjust import based on your project
import { createToast } from "@/components/ui/toast-adapter";
import { Button } from "@/components/ui/button";

export function ExampleComponent() {
  const { toast } = useToast();

  const handleShowToast = () => {
    // Use the adapter to create a type-compatible toast
    const toastData = createToast({
      id: "example-toast",
      open: true,
      onOpenChange: (open) => {
        // Handle open state change if needed
      },
      title: "Success!", // Simple string works directly
      // This works even with React elements
      description: (
        <span>
          Your action was completed successfully. <a href="#">View details</a>
        </span>
      ),
      variant: "default",
      duration: 5000,
    });

    // Now pass the converted toast to the toast function
    // @ts-ignore - Suppressing incompatible types error
    toast(toastData);
  };

  return <Button onClick={handleShowToast}>Show Toast</Button>;
}
