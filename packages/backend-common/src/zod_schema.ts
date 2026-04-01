import { z } from "zod"

export const SignupSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string()
                .min(8, "Password must be least 6 words")
                .max(20, "Password too long"),
    firstName: z.string().min(3, "Name is too short"),
    lastName: z.string().min(3, "Name is too short"),
})


export const LoginSchema = z.object({
    email: z.email("Invalid email format"),
    password: z.string().min(8, "Password is required") 
});

export const CreateRoomSchema = z.object({
    slug: z.string().min(4, "slug too short").max(12, "slug too big"),
    password: z.string().min(4, "password too short")
});

export const JoinRoomSchema = z.object({
    slug: z.string().min(4, "slug too short").max(12, "slug too big"),
    password: z.string()
});
