import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        video: videoId
    })

    if (existingLike) {
        await existingLike.deleteOne()
        res.status(200).json(new ApiResponse(true, "Video unliked successfully"))
    } else {
        const newLike = new Like({
            likedBy: req.user._id,
            video: videoId
        })
        await newLike.save()
        res.status(201).json(new ApiResponse(true, "Video liked successfully", newLike))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        comment: commentId
    })

    if (existingLike) {
        await existingLike.deleteOne()
        res.status(200).json(new ApiResponse(true, "Comment unLiked successfully"))
    } else {
        const newLike = new Like({
            likedBy: req.user._id,
            comment: commentId
        })
        await newLike.save()
        res.status(201).json(new ApiResponse(true, "Comment liked successfully", newLike))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const existingLike = await Like.findOne({
        likedBy: req.user._id,
        tweet: tweetId
    })

    if (existingLike) {
        await existingLike.deleteOne()
        res.status(200).json(new ApiResponse(true, "Tweet unliked successfully"))
    } else {
        const newLike = new Like({
            likedBy: req.user._id,
            tweet: tweetId
        })
        await newLike.save()
        res.status(201).json(new ApiResponse(true, "Tweet liked successfully", newLike))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
        .populate("video", "title thumbnail owner")
        .sort({ createdAt: -1 })

    res.status(200).json(new ApiResponse(true, "Liked videos fetched successfully", likedVideos))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}