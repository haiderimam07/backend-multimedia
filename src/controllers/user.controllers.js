import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"



const generateAccessAndRefreshTokens= async (userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken,refreshToken}


    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating Acess amd Refresh Tokens")
    }
}


const registerUser=asyncHandler( async (req,res)=>{
    // when we try to register a new user steps that are involved
    // get user details-from frontend or postman
    // validations -not empty
    // check if user already exist or not -email/username
    // check for images ,check for avatar
    // upload them to cloudinary, check if uploaded or not 
    // create userobject -create entry in database object format as mongoDB is noSQL database
    // remove password and refersh token field from response
    // check for user creation and return response
    const {fullname , email, username, password}=req.body

    // console.log(fullname,email)
    
    //the data that comes form the user we need to check if all necessary fields are present or not
    // we can check it by simple if condition ans check manually for each field 
    // there is new much more profeeesional approach
    if([fullname, email, username,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400, "All fields are mandotary")
    }
    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User or email already existed")
    }

    // check for images
    const avatarLocalPath=req.files?.avatar[0]?.path
    // const coverImageLocalPathreq.file?.coverImage[0]?.path
    // alternative better approach as it is manually checking if coverImage is uploaded or not
    // check if coverImage is uploaded or not if not then we simply do not upload on cloudinary
    let coverImageLocalPath;
    if(req.files && (Array.isArray(req.files.coverImage)) && (req.files.coverImage.length>0)){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"avatar is required")

    }
    // in the model coverImage is not required so we do not need to check weather it is uploaded or not
    // if(!coverImageLocalPath){
    //     throw new ApiError(400, "cover image is required")
    // }
    // uploading on cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)


    if(!avatar){
        throw new ApiError(400,"avatar is required")
    }
    // if(!coverImage){
    //     throw new ApiError(400, "cover image is required")
    // }

    const user= await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase(),
    })
    // int this createdUser there is everything except password and refreshToken
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500, "something went wrong wile registering the user")
    }


    // if everything is correct then send the respone
    return res.status(201).json(
        new ApiResponse(200,createdUser, "user registered succesfully")
    )
})

const loginUser =asyncHandler( async (req,res)=>{
    // steps involved for login 
    // step-1:take either username/email and password
    // step-2:we need to find weather this username/email and password matched or not if it matched then we generate access token and refersh toke and authenticate the user to the application
    // send cookie
    const {username , email , password}=req.body
    if(!username && !email){
        throw new ApiError(400, "username or email is required")
    }
    const user =await User.findOne({
        $or:[{username}, {email}]
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    // check for password
    const isPasswordValid= await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401, "password is incorrect")
    }

    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    const loggedinUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken", refreshToken,options)
    .json(
        new ApiResponse(200,{
        user:loggedinUser,accessToken,refreshToken
    },
    "User logged in Succesfully"
    )
    )
    
})

const logoutUser=asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set :{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }
    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User Logged out")
    )
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Access")
    }

    try {
        const dedcodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        const user=await User.findById(dedcodedToken._id)
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(dedcodedToken !== user?.refreshToken){
            throw new ApiError(401,"refresh Token is expired or Used")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken ,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
    
        return res.status(201)
        .cookie("accessToken",accessToken ,options)
        .cookie("refreshToken",newRefreshToken ,options)
        .json(
            new ApiResponse(200,
                {accessToken,refreshToken:newRefreshToken},"Access Token refresh Succesfully")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid Refresh Token")
    }
})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user =await User.findById(req.user?._id)
    const isPasswordValid=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(400, "Password is incorrect" )
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
    .json(new ApiResponse(200,"Password change Succesfully"))
})

const getCurrentUser=asyncHandler(async (req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200, req.user, "Current User fetched Succesfully"))
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
    const {fullname, email}=req.body
    if(!(fullname || email)){
        throw new ApiError(401, "All fields are Required")
    }
    const user= User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullname,
            email
        }
    },{new:true}).select("-password")
    return res.status(200)
    .json(new ApiResponse(200,user,"Account Updated Succesfully"))

})

const avatarUpdate =asyncHandler(async (req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"file not uploaded")
    }
    const avatar= await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(401,"Avatar is not uploaded")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            avatar:avatar.url
        }
    },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"avatar updated Succesfully"))
} )

const coverImageUpdate =asyncHandler(async (req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"file not uploaded")
    }
    const coverImage= await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(401,"coverImage is not uploaded")
    }
    const user=await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            coverImage:coverImage.url
        }
    },{new:true}).select("-password")

    return res.status(200)
    .json(new ApiResponse(200,user,"coverImage updated Succesfully"))
} )

const getUserChannelProfile=asyncHandler(async (req,res)=>{
    const {username}=req.params
    if(!username?.trim()){
        throw new ApiError(400,"username does not exist")
    }
    const channel=User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelSubscriberTo:{
                    $size:"$subscriberTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelSubscriberTo:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    if(!channel?.length){
        throw new ApiError(404,"Channel not found")
    }

    return res.status(200)
    .json(new ApiResponse(201,channel[0],"user channel fetch succesfully"))
})

const getWatchHistory=asyncHandler(async (req, res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            $first:"$owner"
                        }
                    }
                ]

            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(201,user[0].watchHistory),"Watch History fetch succesfully")
})

export {registerUser, loginUser ,logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails,avatarUpdate,coverImageUpdate,getUserChannelProfile,getWatchHistory}