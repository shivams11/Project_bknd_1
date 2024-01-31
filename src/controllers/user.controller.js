import {asynchandeler} from '../utils/asynchandeler.js'


const registerUser = asynchandeler(async(req,res)=>{
    res.status(500).json({
        message:"ok"
    })
})

export {registerUser}
