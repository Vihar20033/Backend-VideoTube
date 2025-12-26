import mongoose, { isValidObjectId } from "mongoose" // Check if string is valid ObjectId MongoDB

import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"


// Fetch and filter published videos with pagination , sorting and search
const getAllVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    const filter = { isPublished: true }

    if (query) {
        // Find Video where title or description matches the query (case-insensitive)
        filter.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ]
    }

    if (userId) {
        // Validate userId and filter by owner (Show videos of a specific user)
        if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId")
        const user = await User.findById(userId)
        if (!user) throw new ApiError(404, "User not found")
        filter.owner = userId
    }

    const sortOptions = {}
    if (sortBy) sortOptions[sortBy] = sortType === "desc" ? -1 : 1 
    else sortOptions.createdAt = -1  // Default sort by newest first

    // For eg. sorted by views: /videos?sortBy=views&sortType=desc   sortOptions = { views: -1 }


    const videos = await Video.find(filter)
        .sort(sortOptions)                  // Apply sorting either by views, createdAt etc.
        .skip((page - 1) * limit)           // Pagination: Skip (page-1)*limit documents
        .limit(parseInt(limit))             // Limit to 'limit' documents
        .populate("owner", "name email")   // Populate owner field with name and email

    const total = await Video.countDocuments(filter)

    res.status(200).json(new ApiResponse(true, "Videos fetched", {
        videos,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    }))
})

const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
        throw new ApiError(400, "Video and thumbnail required")
    }

    if (!title || !description) {
         throw new ApiError(400, "Title and description required")
    }
       
    const videoResult = await uploadOnCloudinary(req.files.videoFile[0].path, "video")
    const thumbnailResult = await uploadOnCloudinary(req.files.thumbnail[0].path, "image")

    const video = await Video.create({
        title,
        description,
        videoFile: videoResult.secure_url,
        thumbnail: thumbnailResult.secure_url,
        duration: videoResult.duration,
        owner: req.user._id,
        isPublished: true
    })

    res.status(201).json(new ApiResponse(true, "Video published", video))
})

const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId).populate("owner", "name email")

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.views += 1
    await video.save()

    res.status(200).json(new ApiResponse(true, "Video fetched", video))
})

const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const { title, description } = req.body

    if (title) {
        video.title = title
    }

    if (description) {
        video.description = description
    }

    if (req.file) {
        const thumbResult = await uploadOnCloudinary(req.file.path, "image")
        video.thumbnail = thumbResult.secure_url
    }

    await video.save()
    res.status(200).json(new ApiResponse(true, "Video updated", video))
})

const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // Extract public_id and delete from Cloudinary
    if (video.videoFile) {
        const videoPublicId = video.videoFile.split("/").pop().split(".")[0]
        await deleteFromCloudinary(videoPublicId, "video")
    }

    if (video.thumbnail) {
        const thumbPublicId = video.thumbnail.split("/").pop().split(".")[0]
        await deleteFromCloudinary(thumbPublicId, "image")
    }

    await video.deleteOne()
    res.status(200).json(new ApiResponse(true, "Video deleted", null))
})

const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    video.isPublished = !video.isPublished
    await video.save()

    res.status(200).json(new ApiResponse(true, "Publish status updated", video))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
