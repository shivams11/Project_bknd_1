// require('dotenv').config({path:'./env'}) 

import dotenv from "dotenv"
// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
// import express from "express";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './env'
})



connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`MONGIDB IS RUNNING AT PORT : ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Got tye Error : ",error)
})
















/*
const app = express();

(async () => {
    try {
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        
        app.on("error",(error)=>{
            console.log("Error : ",error);
            throw error;
        })
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    } catch (error) {
        console.log("Error : ", error);
    }



})()
*/
