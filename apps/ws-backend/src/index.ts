import { WebSocketServer, WebSocket } from 'ws'
import jwt from "jsonwebtoken"
import { SECRET } from "@repo/backend-common/config"

const ws = new WebSocketServer({ port: 8080 })

const allSockets = new Map<string, WebSocket[]>();

// webSocket only takes either string or binary.
let currentUserRoom: string = "";

ws.on("connection", (socket, request) => {

    const url = request.url;
    if (!url) {
        return;
    }
    const queryParams = new URLSearchParams(url.split('?')[1])
    const token = queryParams.get('token') || ""

    const response = jwt.verify(token, SECRET) //env variable signature)

    if (!response ) {
        socket.close()
        return;
    }
    
    socket.on("message", (message) => {
        // string to an object 
        try{  
            //@ts-ignore
            const parsedMessage = JSON.parse(message);
            if (parsedMessage.type === "join") {
    
                currentUserRoom = parsedMessage.payload.roomId;
    
                if (!allSockets.has(currentUserRoom)) {
                    allSockets.set(currentUserRoom, [])
                }
    
                allSockets.get(currentUserRoom)!.push(socket)
                socket.send("Room Joined")   
            }
    
            if (parsedMessage.type === "chat") {
                let targetRoom = parsedMessage.payload.roomId;
                let sockets = allSockets.get(targetRoom);
                
                if(sockets) {
                    sockets.forEach((soc) => {
                        if (soc.readyState === WebSocket.OPEN){
                            soc.send(parsedMessage.payload.message)
                        }
                    })
                }
            }       

        }
        catch(err) {
            socket.send("You sent a invalid input")
        }
    })

    socket.on("close", () => {
        if (currentUserRoom) {
            const sockets = allSockets.get(currentUserRoom)
            if (sockets) {
                allSockets.set(currentUserRoom, sockets.filter((soc) => soc !== socket))
            }
        }
    })

})