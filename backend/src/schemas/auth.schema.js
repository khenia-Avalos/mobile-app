import { z } from 'zod';



export const registerSchema = z.object({
    username: z.string( "Username is required"),
    email: z.email( "Email is required"),
    password: z.string( "Password is required").min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
    email: z.email( "Email is required"),
    password: z.string( "Password is required").min(6, "Password must be at least 6 characters"),
});