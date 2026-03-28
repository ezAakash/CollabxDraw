import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { userRouter } from "./router/users"
import { roomRouter } from "./router/rooms"


dotenv.config()


const app = express()

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => {
    res.end("healthy connection... ")
})

app.use("/user", userRouter)
app.use("/room", roomRouter)

app.listen(3000)