import { asyncHandler} from '../utils/asyncHandler.js'
import {ApiErorr} from '../utils/ApiError.js'
import { User } from '../models/User.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'

const registerUser = asyncHandler( async (req,res) =>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists : username,enail
    // check for images,cheack for avatar
    // upload them to cloudinary,avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return res

    const {fullName,email,username, password} = req.body
    // console.log("email :",email);

    if (
        [fullName,email,username,password].some((field) => field?.trim() === "")
    ) {
        throw new ApiErorr(400, "All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username },{ email }] 
    })

    if(existedUser){
        throw new ApiErorr(409," User with email or username already exists")
    }

    // console.log(req.files);

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiErorr(400,"Avatar File is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    

    if(!avatar){
        throw new ApiErorr(400,"Avatar File is required")
    }

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",   //coverimage is not checked additionally
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiErorr(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser , "User Registered Successfully")
    )

} )

export {registerUser}