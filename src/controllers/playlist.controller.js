import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req, res) => {

    const { name, description } = req.body

    if (!name) {
        throw new ApiError(400, "Playlist name is required")
    }

    const newPlaylist = new Playlist({
        name,
        description,
        user: req.user._id,
        videos: []
    })

    await newPlaylist.save()

    res
        .status(201)
        .json(new ApiResponse(true, "Playlist created successfully", newPlaylist))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId")
    }

    if (userId !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to view these playlists")
    }

    const playlists = await Playlist.find({ user: userId })

    res
        .status(200)
        .json(new ApiResponse(true, "User playlists fetched successfully", playlists))
})

// ✅ Get playlist by ID
const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId).populate("videos")

    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to view this playlist")
    }

    res
        .status(200)
        .json(new ApiResponse(true, "Playlist fetched successfully", playlist))
})

// ✅ Add a video to a playlist
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }

    // Check if video already exists
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist")
    }

    playlist.videos.push(videoId)
    await playlist.save()

    res
        .status(200)
        .json(new ApiResponse(true, "Video added to playlist successfully", playlist))
})

// ✅ Remove a video from a playlist
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlistId or videoId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }

    const initialLength = playlist.videos.length
    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId.toString()
    )

    if (playlist.videos.length === initialLength) {
        throw new ApiError(400, "Video not found in playlist")
    }

    await playlist.save()

    res
        .status(200)
        .json(new ApiResponse(true, "Video removed from playlist successfully", playlist))
})

// ✅ Delete a playlist
const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    await playlist.deleteOne()

    res
        .status(200)
        .json(new ApiResponse(true, "Playlist deleted successfully", null))
})

// ✅ Update playlist details (name or description)
const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found")
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this playlist")
    }

    if (name) playlist.name = name
    if (description) playlist.description = description

    await playlist.save()

    res
        .status(200)
        .json(new ApiResponse(true, "Playlist updated successfully", playlist))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
