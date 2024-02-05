import { asynchandeler } from '../utils/asynchandeler.js'
import { Apierror } from '../utils/Apierror.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudnary.js'
import { ApiResponse } from '../utils/Apiresponse.js'
import jwt from "jsonwebtoken"
import mongoose from 'mongoose'

const generateAccessandRefreshToken = async (userid) => {
    try {
        const user = await User.findById(userid);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({ validateBeforeSave: false }); // pass pan check karel te nbakoy mhanun 

        return { accessToken, refreshToken };

    } catch (error) {
        throw new Apierror(404, "Error while geenrating Access and refresh token ")
    }
}

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

    //console.log(req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


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
        "-password -refreshToken"
    )
    if (!createdUser) { throw new Apierror(500, "Something Went wrong when registering User") }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asynchandeler(async (req, res) => {

    const { username, email, password } = req.body;

    if (!(username || email)) {
        throw new Apierror(401, "Username or email is Required !!")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new Apierror(404, "User not found")
    }

    const isPassword = await user.isPasswordCorrect(password)

    if (!isPassword) { throw new Apierror(404, "Password is Incorrect ") }

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id); //destructure and taking that two values 

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )

})


const logoutUser = asynchandeler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, " Logout Successfully !!")
        )

})

const refreshAccessToken = asynchandeler(async (req, res) => {

    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if (!incomingRefreshToken) {
            throw new Apierror(401, "unauthorized Request !! ")
        }

        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new Apierror(401, "Inavalid refresh Token !!")
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new Apierror(401, "Refresh Token is Expired or used ")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, newrefreshToken } = await generateAccessandRefreshToken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newrefreshToken
                    },
                    "Access Token Sent successfully !!"

                )

            )

    } catch (error) {
        throw new Apierror(400, "Invalid RefreshToken !!!")
    }


})

const changeCurrentPassword = asynchandeler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await isPasswordCorrect(oldPassword);
    if (!isPasswordCorrect) {
        throw new Apierror(401, "Incorrect password")
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed Succesfuylly !!"))

})

const getCurrentUser = asynchandeler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "User Fetched Succesfully !!"))
})

const updateAccountDetaile = asynchandeler(async (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
        throw new Apierror(400, "Both Fields Required !!")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                username: username,
                email: email
            }
        },
        { new: true }
    ).select("-password")
    //user var madye navin gishti update karun apan response madye user la dakhvu mhnun pasas kadhtoy

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account Detaile updated !!"))


})

const updateUserAvatar = asynchandeler(async (req, res) => {

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new Apierror(400, "Avatar file not found")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new Apierror(400, "Error While Uploading avatar !")
    }

    const user = await User.findByIdAndUpdate(
        req.user?.avatar,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true },
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar Updated Successfully !!"))

})

const updateUsercoverImage = asynchandeler(async (req, res) => {

    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new Apierror(400, "coverImage file not found")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
        throw new Apierror(400, "Error While Uploading coverImage !")
    }

    const user = await User.findByIdAndUpdate(
        req.user?.coverImage,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true },
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "coverImage Updated Successfully !!"))

})

const getUserAccountDetailes = asynchandeler(async(req,res)=>{
    const {username} = req.params;
    if(!username?.trim()){
        throw new Apierror(400,"username not found")
    }

    const channel = await User.aggregate([
        {
            $match :{
                username:username?.toLowerCase()
            }           
        },
        {
            $lookup : {
                from:"subscriptions",
                localField:"_id",
                foreignField:"Channel",
                as:"Subscribers"
            }
        },
        {
            $lookup : {
                from:"subscriptions",
                localField:"_id",
                foreignField:"Subscriber",
                as:"SubscribedTo"
            }
        },
        {
            $addFields : {
                  subscribersCount :{
                     $size :"$Subscribers"
                  },
                  channelSubscribeToCount :{
                    $size : "$SubscribedTo"
                  },
                  isSubscribedTo:{
                     $cond :{ //if then else
                        if :{ 
                            $in :[req.user?._id,"Subscribers"],
                            then:true,
                            else:false                   
                    }
                     }
                  }
            }
        },
        {
            $project:{
                fullName:1,
                username:1,
                email:1,
                subscribersCount:1,
                channelSubscribeToCount:1,
                avatar:1,
                coverImage:1
                
            }
        }
    ])
    
    if(!channel?.length){
        throw new Apierror(400,"channel not found")
    }
     //rtrn tr arrych krtoy
    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"Channel detailes found !!")
    )

})
//err req res nxt
const getWatchHistory = asynchandeler(async(req,res)=>{

        const user = await User.aggregate([
            {
                $match:{
                    _id : new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistory",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"owner",
                                pipeline:[
                                    {
                                        $project:{
                                            fullName :1,
                                            username:1,
                                            avatar:1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields:{
                                owner:{
                                    $first:"$owner"
                                }
                            }
                        }
                    ]
                }
            }
        ])

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch History Fetched Successfully"
            )
        )
})

export {
    registerUser, loginUser, logoutUser, refreshAccessToken,
    changeCurrentPassword, getCurrentUser, updateAccountDetaile, getUserAccountDetailes , 
    updateUserAvatar, updateUsercoverImage , getWatchHistory
}


// user loggednin ahe tar lagech tyala prun access karta yenarey req.user vaprun karan auth miidleware run jhalay 
