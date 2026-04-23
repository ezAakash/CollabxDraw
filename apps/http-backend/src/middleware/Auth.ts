import { SECRET } from "@repo/backend-common/config";
import jwt from "jsonwebtoken"

export default function Auth() {
    
    return (req: any, res: any, next: any) => {
        
        let token = req.headers.authorization;

        if (!token) {
            return res.status(403).json({ message: "Authorization header missing" })
        }
        
        token = token
            .replace(/[Bb]earer\s+/g, "") 
            .trim()                     
            .replace(/^"(.*)"$/, "$1");
        
        try {
            const response = jwt.verify(token, SECRET);

            if (typeof response === "string" || !response.id) {
                return res.status(403).json({ message: "Invalid Credentials" });
            }

            req.userId = response.id
            next()
        }
        catch (e) {
                res.status(403).json({ message: "Invalid or expired token"})
        }
    }
}