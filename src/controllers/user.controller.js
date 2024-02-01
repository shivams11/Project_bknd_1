import { asynchandeler } from '../utils/asynchandeler.js'
import { Apierror } from '../utils/Apierror.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from '../utils/cloudnary.js'
import { ApiResponse } from '../utils/Apiresponse.js'
import jwt from "jsonwebtoken"

const generateAccessandRefreshToken = async (userid)=>{
    try{
        const user = await User.findById(userid);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({validateBeforeSave: false}); // pass pan check karel te nbakoy mhanun 

        return {accessToken,refreshToken};

    }catch(error){
        throw new Apierror(404,"Error while geenrating Access and refresh token ")
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
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath=req.files.coverImage[0].path;
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

const loginUser = asynchandeler(async(req,res)=>{
   
    const {username,email,password} = req.body;

    if(!(username || email)){
        throw new Apierror(401,"Username or email is Required !!")
    }

    const user = await User.findOne({ 
            $or : [{username},{email}]   
    })
    
    if(!user){
        throw new Apierror(404,"User not found")
    }

    const isPassword = await user.isPasswordCorrect(password)

    if(!isPassword){ throw new Apierror(404, "Password is Incorrect ")}

    const { accessToken ,refreshToken}=await generateAccessandRefreshToken(user._id); //destructure and taking that two values 
 
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure :true
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


const logoutUser = asynchandeler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new ApiResponse(200 , {}," Logout Successfully !!")
    )
    
})

const refreshAccessToken = asynchandeler(async(req,res)=>{

   try {
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 
     if(!incomingRefreshToken){
         throw new Apierror(401,"unauthorized Request !! ")
     }
 
     const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new Apierror(401,"Inavalid refresh Token !!")
     }
 
     if(incomingRefreshToken !== user.refreshToken){
         throw new Apierror(401,"Refresh Token is Expired or used ")
     }
 
     const options={
         httpOnly:true,
         secure:true
     }
 
     const { accessToken , newrefreshToken} = await generateAccessandRefreshToken(user._id);
 
     return res
     .status(200)
     .cookie("accessToken",accessToken,options)
     .cookie("refreshToken",newrefreshToken,options)
     .json(
        new ApiResponse(
            200,
            {
                accessToken,
                refreshToken:newrefreshToken
            },
            "Access Token Sent successfully !!"

        )
         
     )
 
   } catch (error) {
         throw new Apierror(400,"Invalid RefreshToken !!!")
   }


})




export { registerUser , loginUser , logoutUser , refreshAccessToken}
