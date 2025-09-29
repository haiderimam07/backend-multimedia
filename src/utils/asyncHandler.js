
const asyncHandler =(requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=>next(err))
    }
}



export {asyncHandler}

// const asyncHandler=()=>{}
// const asyncHandler=(fn)=>{()=>{}}
// const asyncHandler =(fn)=> async ()=>{}

    // this is one method to make a utility wrapper for our connection of mongodb
// const asyncHandler =(fn)=> async (req,res,next)=>{
//     try {
//         await fn(req,res,next)
        
//     } catch (error) {
//         res.status(error.code || 500 ).json({
//             sucess:false,
//             message:error.message
//         })
//     }
// }