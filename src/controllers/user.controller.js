import { asynchandeler } from '../utils/asynchandeler.js'
import { Apierror } from '../utils/Apierror.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudnary.js'
import { ApiResponse } from '../utils/Apiresponse.js'


const registerUser = asynchandeler(async (req, res) => {
    // res.status(500).json({
    //     message:"ok"
    // })
    const { fullName, username, email, password } = req.body

    if (
        [fullName, username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new Apierror(409, " All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new Apierror(40, "User with username or email is already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) { throw new Apierror(405, "Avatar image is required ") }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) { throw new Apierror(400, "Avatar is required !!") }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        email,
        coverImage: coverImage?.path || "",
        username: (username || "").toLowerCase(),
        password,
    });


    const createdUser = await User.findById(user._id).select(
        "-password -refreshTocken"
    )
    if (!createdUser) { throw new Apierror(500, "Something Went wrong when registering User") }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

export { registerUser }
