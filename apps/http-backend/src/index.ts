import express from "express"

const app = express()

app.get("/health", (req, res) => {
    res.end("healthy connection... ")
})

app.listen(3000)