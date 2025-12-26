import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
})

const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) return null

        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType
        })

        // file has been uploaded successfull
        fs.unlinkSync(localFilePath)
        return response

    } catch (error) {
        // remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    try {

        if (!publicId) return null

        const response = await cloudinary.uploader.destroy( publicId, {
            resource_type: resourceType
        })

        return response

    } catch (error) {

        console.log("Error deleting file from cloudinary:", error)
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }