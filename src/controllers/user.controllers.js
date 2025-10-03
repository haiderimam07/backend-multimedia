import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiErrors.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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

    console.log(fullname,email)
    //the data that comes form the user we need to check if all necessary fields are present or not
    // we can check it by simple if condition ans check manually for each field 
    // there is new much more profeeesional approach
    if([fullname, email, username,password].some((field)=> field?.trim()==="")){
        throw new ApiError(400, "All fields are mandotary")
    }
    const existedUser=User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User or email already existed")
    }

    // check for images
    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverImageLocalPath=req.files?.coverImage?.path

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


    // res.status(200).json({
    //     message:"ok"
    // })
})

export {registerUser}