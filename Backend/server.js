
import express from 'express'
import {createServer} from 'http'   
import { Server } from 'socket.io'
import {YSocketIO } from 'y-socket.io/dist/server'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

const ySocketIO = new YSocketIO(io)
ySocketIO.initialize()


app.get('/', (req, res) => {    
    res.status(200).json({
        message: "Hello World!",
        success: true

    })
})

app.get('/health', (req, res) => {
    res.status(200).json({
        message: "ok",
        success: true
    })
})


const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Retrying in 2 seconds...`)
        setTimeout(() => {
            httpServer.close()
            httpServer.listen(PORT)
        }, 2000)
    } else {
        throw err
    }
})
