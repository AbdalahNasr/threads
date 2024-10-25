"use server"

import { revalidatePath } from "next/cache"
import Thread from "../models/thread.model"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import { model } from "mongoose"


interface Params{
    text: string,
    author: string,
    communityId: string | null,
    path: string,
}

export async function createThread({text,author,communityId,path}:Params){

    try {
        connectToDB()
        const createThread = await Thread.create({
            text,
            author,
            community: null
        
        })
        // update user model
        await User.findByIdAndUpdate(author,{
            $push: {
                threads: createThread._id
            }
    
    
        })
        revalidatePath(path);
        
    } catch (error : any) {
        throw new Error(
            `Error creating thread: ${error.message}`
        )
        
    }

}

export async function fetchPosts(PageNumber = 1,PageSize = 20) {
 connectToDB();
// calc the posts you have to skip
const skipAmount= (PageNumber -1) * PageSize

//  fetch the top lvl threads (no parents)
 const postQuery =  Thread.find({ 
    parentId: {$in:[null,undefined

    ]} }).sort({ createdAt: 'desc' })
 .skip(skipAmount).limit(PageSize)
 .populate({path:'author', model : User})
 .populate({
    path:'children',
    populate:{
        path:'author',
        model:User,
        select:"id_name parentId image"


    }
 })

 const totalPostCount = await Thread.countDocuments({ 
    parentId: {$in:[null,undefined]} })
 
    const posts = await postQuery.exec();
    const isNext = totalPostCount > skipAmount + posts.length;
    return {posts,isNext};

}

export async function fetchThreadById(id: string) {
    connectToDB();
    try {
        
        // TODO populate community
        const thread = await  Thread.findById(id)
        
        .populate({
            path:'author', 
            model : User,
        select:"_id id name image"
        })
        // .populate({
        //     path:'community', 
        //     model : User,
        // select:"_id id name image"
        // })
        .populate({
            path:'children',
            populate:[
                {
                path:'author',
                model:User,
                select:"_id id parentId  name image"
            },
           { path : 'children',
            model : Thread,
            populate:  {
                path:'author',
                model:User,
                select:"_id id parentId  name image"
            } 
         },
        ]
        }).exec()
        return thread;

    } catch (error:any) {
        throw new Error(`Error fetching thread : ${error.message} `)

        
    }
}


 export async function addCommentToThread(
    threadId:string,
    commentText:string,
    userId:string,
    path:string


 ) {

    connectToDB()
    try {
        // finding the origin thread
        const  originalThread= await Thread.findById(threadId)

        if (!originalThread) {
            throw new Error(
                `Thread does not found`
            )
        }
        // create a new thread with the comment
        const commentThread = new Thread({

            text:commentText,
            author:userId,
            parentId:threadId,

        })
        // save the new thread
        const savedCommentThread= await commentThread.save();
        // add the new thread to the original thread's children include comment
        originalThread.children.push(savedCommentThread._id);
        // save the original thread
        await originalThread.save();




    } catch (error :any) {
        throw new  Error(
            `Error adding comment to thread : ${error.message} `
        )
    }
    
 } 