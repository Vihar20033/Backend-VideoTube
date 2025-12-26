import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
    getVideoComments,
    getTweetComments,
    addComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js"

const router = Router()

router.use(verifyJWT) // Apply verifyJWT middleware to all routes

router.route("/v/:videoId").get(getVideoComments).post(addComment)
router.route("/t/:tweetId").get(getTweetComments).post(addComment)
router.route("/:commentId").patch(updateComment).delete(deleteComment)

export default router