import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetaile, updateUserAvatar, updateUsercoverImage, getUserAccountDetailes, getWatchHistory } from "../controllers/user.controller.js";
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

router.route("/change-password").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetaile)
//patch thevaave lagel updaetkartoy so post kel tar sagli detail update hoiel

router.route("/avatar").patch(verifyJWT, upload.single("/avatar"), updateUserAvatar)
//updat kartoy so patch vaprle and pahile verify kle nanter upload je multer che mid ahe te vaprle karan pahile ek file pan ghyavi lagelk na and ekach file ghyayachiye mhanun . single madye tya file che nav takle and mag update vale function run kel

router.route("/cover-Image").patch(verifyJWT, upload.single("/coverImage"), updateUsercoverImage)

router.route("/c/:username").get(verifyJWT, getUserAccountDetailes)
// paramps ne value ghetliye mhanun ethe problem hoto ....jara route adress vegla takavba lagel ... yat /c/ he tu kahihi lihu hskato but tyananter : vaprun je lihli  na tyachi value te ghete 

router.route("/history").get(verifyJWT, getWatchHistory)

export default router
