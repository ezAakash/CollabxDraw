import express, { Router } from "express"
import Auth from "../middleware/Auth"
import { CreateRoomSchema, JoinRoomSchema } from "@repo/backend-common/zod_schema"
import { prisma } from "@repo/db/prisma"
import bcrypt from "bcrypt"

export const roomRouter: Router = express.Router()


roomRouter.post("/create", Auth(), async (req, res) => {

    const result = CreateRoomSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            message: "Incorrect input format",
            errors: result.error.issues[0]
        })
    }

    const { slug, password } = req.body

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const room = await prisma.room.create({
            data: {
                slug: slug,
                password: hashedPassword,
                adminId: (req as any).userId
            }
        })
        res.status(201).json({
            message: "Room is created.",
            room
        })
    }
    catch (err) {
        return res.status(500).json({ message: "Something went wrong either DB not connected or Room slug already exist.." })
    }
})

roomRouter.post("/join", Auth(), async (req, res) => {
    const result = JoinRoomSchema.safeParse(req.body)

    if (!result.success) {
        return res.status(400).json({
            message: "Incorrect input format",
            errors: result.error.issues[0]
        })
    }

    const { slug, password } = req.body

    try {
        const room = await prisma.room.findUnique({
            where: { slug }
        })

        if (!room) {
            return res.status(404).json({ message: "Room not found" })
        }

        const passwordMatch = await bcrypt.compare(password, room.password)

        if (!passwordMatch) {
            return res.status(403).json({ message: "Incorrect password" })
        }

        res.json({
            message: "Joined successfully",
            room
        })
    } catch (err) {
        res.status(500).json({ message: "Something went wrong while joining room" })
    }
})

roomRouter.get("/rooms", Auth(), async (req, res) => {
    try {
        const userId = (req as any).userId;
        const rooms = await prisma.room.findMany({
            where: { adminId: userId },
            orderBy: { createAt: "desc" },
            include: {
                admin: {
                    select: { name: true, email: true }
                }
            }
        })
        res.json({ rooms })
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch rooms" })
    }
})

roomRouter.delete("/:roomId", Auth(), async (req, res) => {
    try {
        const userId = (req as any).userId;
        const roomId = parseInt(req.params.roomId);

        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        if (room.adminId !== userId) {
            return res.status(403).json({ message: "Only the room owner can delete this room" });
        }

        // Delete all elements first, then the room
        await prisma.drawElement.deleteMany({ where: { roomId } });
        await prisma.room.delete({ where: { id: roomId } });

        res.json({ message: "Room deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete room" });
    }
})

roomRouter.get("/:roomId/elements", Auth(), async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId)
        const elements = await prisma.drawElement.findMany({
            where: { roomId },
            orderBy: { createdAt: "asc" }
        })
        res.json({ elements })
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch elements" })
    }
})