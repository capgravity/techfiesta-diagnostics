require('dotenv').config(); // Load environment variables first
const { v2: cloudinary } = require("cloudinary");
const fs = require("fs");

cloudinary.config({ 

    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_API_KEY, 
    api_secret: process.env.CLOUDINARY_CLOUD_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            return null
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        console.log("File has been uploaded on cloudinary", response.url);
        console.log(response);
        return response;
    }
    catch(error){
        fs.unlinkSync(localFilePath)
        return null;
    }
}

module.exports = {
    uploadOnCloudinary
};