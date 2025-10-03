import express from 'express';
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express()
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

// json limit for the request that can give to the server
app.use(express.json({limit:"16Kb"}))
app.use(express.urlencoded({extended:"true", limit:"16Kb"}))
app.use(express.static("public"))
// publicly available file like images and things like that

// import router in app.js
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users", userRouter)


app.use(cookieParser())
export {app}