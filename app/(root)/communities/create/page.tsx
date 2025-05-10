"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";

// Form validation schema
const formSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores and hyphens"
    ),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  image: z.string().url("Please enter a valid URL").optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateCommunityPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      bio: "",
      image: "",
    },
  });

  const imageUrl = watch("image");

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/orgs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create community");
      }

      // Redirect to the new community page
      router.push(`/communities/${result.username}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="head-text mb-10">Create Community</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-base-semibold text-gray-900">
            Name *
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="account-form_input"
            placeholder="Community Name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="username"
            className="text-base-semibold text-gray-900"
          >
            Username *
          </label>
          <input
            id="username"
            type="text"
            {...register("username")}
            className="account-form_input"
            placeholder="community-handle"
          />
          {errors.username && (
            <p className="text-red-500 text-sm">{errors.username.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className="text-base-semibold text-gray-900">
            Bio
          </label>
          <textarea
            id="bio"
            {...register("bio")}
            className="account-form_input min-h-[100px]"
            placeholder="Tell us about your community..."
          />
          {errors.bio && (
            <p className="text-red-500 text-sm">{errors.bio.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="image" className="text-base-semibold text-gray-900">
            Image URL
          </label>
          <input
            id="image"
            type="text"
            {...register("image")}
            className="account-form_input"
            placeholder="https://example.com/image.jpg"
          />
          {errors.image && (
            <p className="text-red-500 text-sm">{errors.image.message}</p>
          )}

          {imageUrl && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
              <div className="relative w-20 h-20 rounded-full overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Community image preview"
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/profile-placeholder.svg";
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-primary-500 text-white rounded-lg py-2 px-4 self-end"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Community"}
        </button>
      </form>
    </div>
  );
}
