import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
})

const uploadOnCloudinary=async (localFilePath)=>{
    try {
        if(!localFilePath) return null
        //upload file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })
        //file has been uploaded
        console.log("file has been uploaded",response.url)
        return response
    } catch (error) {
        //if file is not uploaded to cloudinary then we will unlink from our local storage 
        fs.unlinkSync(localFilePath)
    }
}
export {uploadOnCloudinary}