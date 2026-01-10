import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(256),
  password: z.string().min(8).max(256),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
