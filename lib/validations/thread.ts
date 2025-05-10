import * as z from 'zod';

export const ThreadValidation = z.object({
  thread: z.string().min(1, { message: "Thread text is required." }),
  accountId: z.string(),
  
  // Allow null or string for image
  image: z.string().nullable().optional(),
});

export const CommentValidation = z.object({
  thread: z.string().min(1, { message: "Comment text is required." }),
});