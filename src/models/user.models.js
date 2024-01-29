import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"


const userSchema = new Schema(
    {

        username:{
            type:String,
            required:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            trim:true,
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        avatar:{
            required:true,
            type:String   // cloudnary chi link jichyat store karvu
        },
        coverimage:{
            type:String
        },
        watchHistory:[
            {
                type:Schema.Types.ObjectId,
                red:"Video"
            }
        ],
        password:{
            type:String,
            required:[true,"password is required"]
        },
        refreshTocken:{
            type:String
        }


    },
    {
        timestamps: true
    }
)

userSchema.pre("save",function(next){
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password,10)
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password);
}
export const User = mongoose.model("User",userSchema);
