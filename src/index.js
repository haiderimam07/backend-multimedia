// in this we connect our database by mongoose 
// we can use a single line also to import env anf config but it breaks the continuity of our project

// syntax for this is 
// require('dotenv').config({path:'./env'})


// we need to import dotenv to use variable names
// modular approach best approach in modules
import dotenv from 'dotenv'

// import mongoose from 'mongoose';
// import { DB_NAME } from './constants';
import connectDB from './db/index.js';


// config of dotenv file 
dotenv.config({
    path:'./env'
})


// second approach
// simply connect the mongodb in db file to keep our index file clean and easily understandable not bulky hence we simply import it from db file and run that function
connectDB();





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