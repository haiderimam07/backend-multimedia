// in this we connect our database by mongoose 
// we can use a single line also to import env anf config but it breaks the continuity of our project

// syntax for this is 
// require('dotenv').config({path:'./env'})

import dotenv from 'dotenv'
// import {app} from './app.js'
// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';
import connectDB from './db/index.js';
// config of dotenv file 
dotenv.config({
    path:'./env'
})

import {app} from './app.js'

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 ,()=>{
        console.log(`server is listening on port ${process.env.PORT}`)
    });
})
.catch((err)=>{
    console.log("database connection failed",err)
}) 






// this is one approach to connect database and listen on port but it is too congested on index page 
// import express from 'express'
// const app =express();
// // this is a better approach to connect mongo db
// ;(async ()=>{
//     try {
//         await mongoose.connect(`${process.env.MOGODB_URL}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("ERRR:",error);
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`App is listning on port ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("ERROR", error)
//         throw error
//     }
// })()