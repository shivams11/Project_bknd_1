import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app = express()

app.use(cors({
    origin: process.env.ORIGIN_URI,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())


//Router
import userRouter from './routes/user.routes.js'

// router declaration 
app.use("/api/v1/users",userRouter)
//http://localhost:8000/api/v1/users  //http://localhost:8000/api/v1/users/register //http://localhost:8000/api/v1/users/login


export default app;
