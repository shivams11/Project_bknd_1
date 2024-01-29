import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema = new Schema(
    {

        username: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            required: true,
            type: String   // cloudnary chi link jichyat store karvu
        },
        coverimage: {
            type: String
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                red: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, "password is required"]
        },
        refreshTocken: {
            type: String
        }


    },
    {
        timestamps: true
    }
)

userSchema.pre("save", function (next) {
    if (!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next();
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken =  async function(){
    return  await jwt.sign(
        {
           _id : this._id,
           emial:this.email,
           username:this.username,
           fullName:this.fullName
        },  // paylaod ahe he
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken =  async function(){
    return  await jwt.sign(
        {
           _id : this._id
           
        },  // paylaod ahe he
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}




export const User = mongoose.model("User", userSchema);
