
import {v2 as cloudinary} from 'cloudinary';
import fs from "fs" 

cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME , 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null;
       const response=  await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file jhali upload
        // console.log("file uploaded on cloudinary ",response.url)
        fs.unlinkSync(localFilePath);
        return response;
    }catch(error){
        fs.unlinkSync(localFilePath)
        //remove localy saved temporary file as uploada opration get failed
        return null;
        
    }
}

export {uploadOnCloudinary}
