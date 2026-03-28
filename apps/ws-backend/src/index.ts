import { WebSocketServer, WebSocket } from 'ws'
import jwt from "jsonwebtoken"
import { SECRET } from "@repo/backend-common/config"
import { prisma } from "@repo/db/prisma"
import bcrypt from "bcrypt"

const wss = new WebSocketServer({ port: 8080 })

interface SocketMeta {
    userId: string;
    roomId: string | null;
}

const socketMeta = new WeakMap<WebSocket, SocketMeta>();
const rooms = new Map<string, Set<WebSocket>>();

function authenticate(token: string): string | null {
    try {
        const payload = jwt.verify(token, SECRET) as { id: string }
        return payload.id || null
    } catch {
        return null
    }
}

function broadcastToRoom(roomId: string, message: object, excludeSocket?: WebSocket) {
    const socketsInRoom = rooms.get(roomId)
    if (!socketsInRoom) return

    const data = JSON.stringify(message)
    socketsInRoom.forEach((socket) => {
        if (socket !== excludeSocket && socket.readyState === WebSocket.OPEN) {
            socket.send(data)
        }
    })
}

wss.on("connection", (socket, request) => {
    const url = request.url;
    if (!url) {
        socket.close()
        return
    }

    const queryParams = new URLSearchParams(url.split('?')[1])
    const token = queryParams.get('token') || ""
    const userId = authenticate(token)

    if (!userId) {
        socket.send(JSON.stringify({ type: "error", payload: { message: "Authentication failed" } }))
        socket.close()
        return
    }

    socketMeta.set(socket, { userId, roomId: null })

    socket.on("message", async (rawMessage) => {
        try {
            const message = JSON.parse(rawMessage.toString())
            const meta = socketMeta.get(socket)
            if (!meta) return

            switch (message.type) {
                case "join": {
                    const roomId = String(message.payload.roomId)
                    const password = message.payload.password

                    if (!password) {
                        socket.send(JSON.stringify({ type: "error", payload: { message: "Password required" } }))
                        return
                    }

                    
                    try {
                        const room = await prisma.room.findUnique({
                            where: { id: parseInt(roomId) }
                        })
                        
                        if (!room) {
                            socket.send(JSON.stringify({ type: "error", payload: { message: "Room not found" } }))
                            return
                        }

                        const passwordMatch = await bcrypt.compare(password, room.password)
                        
                        if (!passwordMatch) {
                            socket.send(JSON.stringify({ type: "error", payload: { message: "Incorrect password" } }))
                            return
                        }
                    } catch (err) {
                        socket.send(JSON.stringify({ type: "error", payload: { message: "Failed to verify room" } }))
                        return
                    }
                    
                    
                    if (meta.roomId) {
                        const prevRoom = rooms.get(meta.roomId)
                        if (prevRoom) {
                            prevRoom.delete(socket)
                            if (prevRoom.size === 0) rooms.delete(meta.roomId)
                        }
                    }

                    
                    meta.roomId = roomId
                    if (!rooms.has(roomId)) {
                        rooms.set(roomId, new Set())
                    }
                    rooms.get(roomId)!.add(socket)

                    
                    try {
                        const elements = await prisma.drawElement.findMany({
                            where: { roomId: parseInt(roomId) },
                            orderBy: { createdAt: "asc" }
                        })
                        socket.send(JSON.stringify({
                            type: "joined",
                            payload: { elements, roomId }
                        }))
                    } catch (err) {
                        socket.send(JSON.stringify({
                            type: "joined",
                            payload: { elements: [], roomId }
                        }))
                    }
                    break
                }

                case "draw": {
                    if (!meta.roomId) return
                    const elementData = message.payload.element

                    
                    broadcastToRoom(meta.roomId, {
                        type: "element_created",
                        payload: { element: elementData }
                    }, socket)

                    
                    try {
                        await prisma.drawElement.create({
                            data: {
                                id: elementData.id,
                                roomId: parseInt(meta.roomId),
                                type: elementData.type,
                                points: elementData.points,
                                strokeColor: elementData.strokeColor,
                                fillColor: elementData.fillColor,
                                strokeWidth: elementData.strokeWidth,
                                opacity: elementData.opacity,
                                text: elementData.text || null
                            }
                        })
                    } catch (err) {
                        console.error("Failed to persist element:", err)
                    }
                    break
                }

                case "update": {
                    if (!meta.roomId) return
                    const { elementId, updates } = message.payload

                    
                    broadcastToRoom(meta.roomId, {
                        type: "element_updated",
                        payload: { element: { id: elementId, ...updates } }
                    }, socket)

                    
                    try {
                        await prisma.drawElement.update({
                            where: { id: elementId },
                            data: {
                                points: updates.points,
                                strokeColor: updates.strokeColor,
                                fillColor: updates.fillColor,
                                strokeWidth: updates.strokeWidth,
                                opacity: updates.opacity,
                                text: updates.text
                            }
                        })
                    } catch (err) {
                        console.error("Failed to update element:", err)
                    }
                    break
                }

                case "delete": {
                    if (!meta.roomId) return
                    const { elementId } = message.payload

                    
                    broadcastToRoom(meta.roomId, {
                        type: "element_deleted",
                        payload: { elementId }
                    }, socket)

                    
                    try {
                        await prisma.drawElement.delete({
                            where: { id: elementId }
                        })
                    } catch (err) {
                        console.error("Failed to delete element:", err)
                    }
                    break
                }

                default:
                    socket.send(JSON.stringify({ type: "error", payload: { message: "Unknown message type" } }))
            }
        } catch (err) {
            socket.send(JSON.stringify({ type: "error", payload: { message: "Invalid message format" } }))
        }
    })

    socket.on("close", () => {
        const meta = socketMeta.get(socket)
        if (meta?.roomId) {
            const room = rooms.get(meta.roomId)
            if (room) {
                room.delete(socket)
                if (room.size === 0) rooms.delete(meta.roomId)
            }
        }
        socketMeta.delete(socket)
    })
})

console.log("server is running")