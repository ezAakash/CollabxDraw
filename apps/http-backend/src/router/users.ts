import express, { Router } from "express"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { SignupSchema, LoginSchema } from "@repo/backend-common/zod_schema"
import { SECRET } from "@repo/backend-common/config"
import { prisma } from "@repo/db/prisma"


export const userRouter: Router = express.Router()

userRouter.post("/signup", async (req, res) => {
    
    const result = SignupSchema.safeParse(req.body)

    if(!result.success) {
        return res.status(400).json({
            message: "Incorrect input format",
            errors: result.error.issues[0]
        })
    }

    const { firstName, lastName, email, password} = req.body

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.user.create({
            data: {
                name: `${firstName} ${lastName}`,
                email: email,
                password: hashedPassword
            }
        })
    }catch(err: unknown) {
        if (err) {
            return res.status(403).json({message : "Hey, user already exist in DB, please try to logIn"})
        }
    }

    res.status(201).json({
        message: "You are signed up "
    })
})


userRouter.post("/login", async (req, res) => {
    
    const result = LoginSchema.safeParse(req.body)

    if(!result.success) {
        res.status(403).json({
            message : "Invalid cred"
        })
    }
    const { email, password } = req.body;

    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    })

    if (!user) {
        return res.json("User doesn't exist, please signup first")
    }

    const passwordMatch = await bcrypt.compare(password , user.password) //put pulled password her)

    if ( passwordMatch ) {
        const token  = jwt.sign({
            id: user?.id
        }, SECRET)

        res.json({
            token
        })
    }else {
        res.status(403).json({
            message: "Incorrect Credentials"
        })
    }
})



