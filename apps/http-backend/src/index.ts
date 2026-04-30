import express from "express"
import cors from "cors"
import { userRouter } from "./router/users"
import { roomRouter } from "./router/rooms"

const app = express()

const allowedOrigins = [
    "https://collabxdraw.vercel.app",
    "http://localhost:5173",
    "https://collabxdraw.live"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json())

app.get("/health", (req, res) => {
    res.end("healthy connection... ")
})

app.use("/user", userRouter)
app.use("/room", roomRouter)

app.listen(3000)