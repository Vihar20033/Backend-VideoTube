import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    const comments = await Comment.find({ video: videoId })
        .populate("owner", "username avatar email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await Comment.countDocuments({ video: videoId })

    res.status(200).json(new ApiResponse(true, "Comments fetched successfully", {
        comments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    }))
})

const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const comments = await Comment.find({ tweet: tweetId })
        .populate("owner", "username avatar email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await Comment.countDocuments({ tweet: tweetId })

    res.status(200).json(new ApiResponse(true, "Comments fetched successfully", {
        comments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
    }))
})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { videoId, tweetId } = req.params

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }

    if (videoId) {
        if (!isValidObjectId(videoId)) {
            throw new ApiError(400, "Invalid videoId")
        }

        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "Video not found")
        }

        const comment = await Comment.create({
            content,
            video: videoId,
            owner: req.user._id
        })

        const populatedComment = await Comment.findById(comment._id).populate("owner", "username avatar email")
        return res.status(201).json(new ApiResponse(true, "Comment added successfully", populatedComment))
    }

    if (tweetId) {
        if (!isValidObjectId(tweetId)) {
            throw new ApiError(400, "Invalid tweetId")
        }

        const tweet = await Tweet.findById(tweetId)
        if (!tweet) {
            throw new ApiError(404, "Tweet not found")
        }

        const comment = await Comment.create({
            content,
            tweet: tweetId,
            owner: req.user._id
        })

        const populatedComment = await Comment.findById(comment._id).populate("owner", "username avatar email")
        return res.status(201).json(new ApiResponse(true, "Comment added successfully", populatedComment))
    }

    throw new ApiError(400, "Either videoId or tweetId is required")
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Comment content is required")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this comment")
    }

    comment.content = content
    await comment.save()

    const updatedComment = await Comment.findById(comment._id).populate("owner", "username avatar email")
    res.status(200).json(new ApiResponse(true, "Comment updated successfully", updatedComment))
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid commentId")
    }

    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    await comment.deleteOne()
    res.status(200).json(new ApiResponse(true, "Comment deleted successfully", null))
})

export {
    getVideoComments,
    getTweetComments,
    addComment,
    updateComment,
    deleteComment
}