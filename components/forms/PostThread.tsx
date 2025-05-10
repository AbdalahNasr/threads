"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";
import { useThreads } from "../ThreadContextProvider";
import { useToast } from "../ui/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { ThreadValidation } from "@/lib/validations/thread";
import { createThread } from "@/lib/actions/thread.action";
import { useUploadThing } from "@/lib/uplodThing";
import { isBase64Image } from "@/lib/utils";
import Image from "next/image";
import { Input } from "../ui/input";

const toastStyles = {
  className: `
    fixed md:w-[300px] 
    top-4 md:top-auto md:bottom-4 
    right-4 
    flex flex-col gap-2 
    border-none 
    bg-dark-2
    animate-in fade-in-0 
    relative
    after:content-[''] 
    after:absolute 
    after:bottom-0 
    after:left-0 
    after:h-[2px] 
    after:w-full 
    after:[animation:progress_3s_linear_forwards]
  `,
  layout: {
    position: "top-right",
  },
  duration: 3000,
};

interface Props {
  userId: string;
}

function PostThread({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media");

  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { organization } = useOrganization();
  const { addThread } = useThreads(); // Use the thread context
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ThreadValidation>>({
    resolver: zodResolver(ThreadValidation),
    defaultValues: {
      thread: "",
      accountId: userId,
      image: null,
    },
  });

  // Function to handle image change
  const handleImage = (
    e: ChangeEvent<HTMLInputElement>,
    fieldChange: (value: string) => void
  ) => {
    e.preventDefault();

    if (e.target.files && e.target.files.length > 0) {
      const fileReader = new FileReader();

      const file = e.target.files[0];
      setFiles([file]);

      fileReader.onload = async (event) => {
        const imageDataUrl = event.target?.result?.toString() || "";
        fieldChange(imageDataUrl);
      };

      fileReader.readAsDataURL(file);
    }
  };

  const onSubmit = async (values: z.infer<typeof ThreadValidation>) => {
    setError(null);
    setIsLoading(true);

    try {
      // Handle image upload if present
      let uploadedImageUrl = "";

      if (values.image && isBase64Image(values.image)) {
        const imgRes = await startUpload(files);

        if (imgRes && imgRes[0].url) {
          uploadedImageUrl = imgRes[0].url;
        }
      }

      // Get the organization ID (if available)
      const organizationId = organization ? organization.id : null;
      console.log("Organization ID:", organizationId);
      console.log("User ID:", userId, "Type:", typeof userId);

      // Create the thread parameters
      const threadParams = {
        text: values.thread,
        author: userId,
        communityId: organizationId || "", // Use empty string when null
        image: uploadedImageUrl, // Lowercase "image" property
        path: pathname,
      };

      // Use addThread from context - this updates the UI immediately
      const result = await addThread(threadParams);
      console.log("Thread created successfully:", result);

      toast({
        title: "Success!",
        description: organization 
          ? "Your thread has been posted to the community! 🎉" 
          : "Your thread has been posted! 🎉",
        variant: "default",
        className: `${toastStyles.className} after:bg-green-500 text-green-500`,
        layout: toastStyles.layout,
        duration: toastStyles.duration,
      });

      // Reset form
      form.reset();
      
      // Optionally navigate if you still want to change pages
      if (organizationId && pathname.includes("/communities")) {
        router.push(`/communities/${organizationId}`);
      } else if (!pathname.includes("/")) {
        // Only navigate home if we're not already there
        router.push("/");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to create thread";
      console.error("Error creating thread:", error);
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        className: `${toastStyles.className} after:bg-red-500 text-red-500`,
        layout: toastStyles.layout,
        duration: toastStyles.duration,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        className="mt-10 flex flex-col justify-start gap-10"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="thread"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-3">
              <FormLabel className="text-base-semibold text-light-2">
                Content
              </FormLabel>
              <FormControl className="no-focus border border-dark-4 bg-dark-3 text-light-1">
                <Textarea rows={15} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image upload field */}
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col gap-3">
              <FormLabel className="text-base-semibold text-light-2">
                Add Image (Optional)
              </FormLabel>
              <FormControl>
                <div className="flex items-center gap-4">
                  {field.value && (
                    <Image
                      src={field.value}
                      alt="Thread image"
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImage(e, field.onChange)}
                    className="cursor-pointer text-light-1"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {error && (
          <div className="bg-red-500/20 p-4 rounded-lg border border-red-500 text-red-500">
            {error}
          </div>
        )}

        <Button type="submit" className="bg-primary-500" disabled={isLoading}>
          {isLoading
            ? "Posting..."
            : organization
            ? "Post to Community"
            : "Post Thread"}
        </Button>
      </form>
    </Form>
  );
}

export default PostThread;
