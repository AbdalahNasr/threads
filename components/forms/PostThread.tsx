"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useOrganization } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePathname, useRouter } from "next/navigation";
import { ChangeEvent, useState } from "react";

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

interface Props {
  userId: string;
}

function PostThread({ userId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { startUpload } = useUploadThing("media");

  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { organization } = useOrganization();

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

      // Create the thread parameters
      const threadParams = {
        text: values.thread,
        author: userId,
        communityId: organizationId || "", // Use empty string when null
        image: uploadedImageUrl, // Lowercase "image" property
        path: pathname,
      };

      // Use the appropriate path based on whether it's posted to a community
      await createThread(threadParams);

      // Navigate to the appropriate page
      if (organizationId && pathname.includes("/communities")) {
        router.push(`/communities/${organizationId}`);
      } else {
        router.push("/");
      }

      form.reset();
    } catch (error) {
      console.error("Error creating thread:", error);
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
