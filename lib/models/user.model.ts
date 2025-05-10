import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    id:{type:String,required:true,unique:true}, // This should match the Clerk user ID
    username:{type:String,required:true,unique:true},
    name:{type:String,required:true},
    image:String,
    bio:String,
    threads:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Thread'
        }
    ],
    onboarded:{
        type:Boolean,
        default:false
    },
    communities:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Community'
        }
    ],
    // Fields for social connections
    following: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    followers: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    // Friend request fields
    sentRequests: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ],
    receivedRequests: [
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        }
    ]
})

const User =  mongoose.models.User || mongoose.model('User', userSchema)

export default User
