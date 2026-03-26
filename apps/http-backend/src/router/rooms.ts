import express, { Router } from "express"
import Auth from "../middleware/Auth"
import { RoomSchema } from "@repo/backend-common/zod_schema"
import { prisma } from "@repo/db/prisma"

export const roomRouter: Router = express.Router()


roomRouter.post("/create", Auth(),  async (req, res) => {

    const result = RoomSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            message: "Incorrect input format",
            errors: result.error.issues[0]
        })
    } 

    const { slug } = req.body

    try {
        await prisma.room.create({
            data: {
                slug: slug,
                adminId: (req as any).userId
            }
        })
    }
    catch(err) {
        return res.status(500).json({ message: "Something went wrong either DB not connected or Room slug already exist.."})
    }

    res.status(201).json({
        message: "Room is created."
    })
})