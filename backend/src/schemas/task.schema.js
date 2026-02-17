import { z } from 'zod';



export const createTaskSchema = z.object({
    title: z.string({ message: "title is required" }),
    description: z.string({ message: "description must be a string" }),
    date: z.union([z.string(), z.date()]).optional() // ✅ Acepta string o Date
});
