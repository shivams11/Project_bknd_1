import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middelwares/multer.middelware.js"
import { verifyJWT } from "../middelwares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

export default router
