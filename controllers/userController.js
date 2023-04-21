import cloudinary from "cloudinary";
import fs from "fs";
import mongoose from "mongoose";

import { User } from "../models/userModel.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import { sendOTP } from "../utils/sendSMS.js";


export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

 
    const file = req.files;
    if (!file || file === undefined || file === null) {
      return res
        .status(400)
        .json({ success: false, message: "please upload a avatar image" });
    }
  
    let userExists = await User.findOne({
      $or: [{ email: email }, { phone: phone }],
    });

    if (userExists) {
      return res
        .status(400)
        .json({ success: false, message: "user already exists" });
    }
    const otp = Math.floor(Math.random() * 1000000);

    const myCloud = await cloudinary.v2.uploader
      .upload(file.avatar.tempFilePath, {
        folder: "TodoApp",
      })
      .catch((err) => {
        console.log(err);
      });

     fs.rmSync(file.avatar.tempFilePath, { recursive: true });

    userExists = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.url,
      },
      otp,
      phone,
      otp_expiry: Date.now() + process.env.OTP_EXPIRE * 60 * 1000,
    });

    await sendMail(email, "verify your account", `Your OTP is ${otp}`);

    // await sendOTP(phone, `Welcome to Your Todos app 😊 , Your OTP is ${otp}`);

    sendToken(
      res,
      userExists,
      201,
      "OTP sent to your email. Please verify your account"
    );
  
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verify = async (req, res) => {
  try {
    const otp = req.body.otp;
    const user = await User.findById(req.userId);

    if (user.otp !== parseInt(otp) || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or OTP Expired" });
    }
    user.verified = true;
    user.otp = null;
    user.otp_expiry = null;

    await user.save();

    sendToken(res, user, 200, "Account Verified");
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        success: false,
        message: "please enter valid Email and Password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    const matchPassword = await user.comparePassword(password);

    if (!matchPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    sendToken(res, user, 201, "Login successfully");
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", null, {
        expires: new Date(Date.now()),
      })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const addTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    const user = await User.findById(req.userId);

    user.tasks.push({
      title,
      description,
      completed: false,
      createdAt: new Date(Date.now()),
    });

    await user.save();

    res.status(200).json({ success: true, message: "Task added successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const {taskId}  = req.params;

    if(!mongoose.Types.ObjectId.isValid(taskId)){
      return res.status(400).json({success:false,message:"please enter a valid task id"});
    }

    const user = await User.findById(req.userId);

    if(!user){
      return res
        .status(400)
        .json({ success: false, message: "user does not exists" });
    }

    user.task = user.tasks.find((task) => task._id.toString() === taskId.toString());
   
    if(user.task === undefined){
      return res.status(404).send({success:false,message:"No such tasks exists"})
    }
  
    user.task.completed = !user.task.completed;

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Task updated successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const removeTask = async (req, res) => {
  try {
    const { taskId } = req.params;

   if (!mongoose.Types.ObjectId.isValid(taskId)) {
     return res
       .status(400)
       .json({ success: false, message: "please enter a valid task id" });
   }

    const user = await User.findById(req.userId);

    user.tasks = user.tasks.filter(
      (task) => task._id.toString() !== taskId.toString()
    );

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Task removed successfully" });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {

    const user = await User.findById(req.userId);

    sendToken(
      res,
      user,
      201,
      `welcome back ${user.name}`
    )
      
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {

    const user = await User.findById(req.userId);

    const { name } = req.body;
        const file = req.files;

        if (!file || file === undefined || file === null) {
          return res
            .status(400)
            .json({ success: false, message: "please upload your avatar image" });
        }
    
    if(name){user.name=name};
    if(file.avatar){
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      
       const myCloud = await cloudinary.v2.uploader.upload(file.avatar.tempFilePath, { folder: "TodoApp" })
    
       fs.rmSync(file.avatar.tempFilePath, { recursive: true });

       user.avatar ={
        public_id:myCloud.public_id,
        url:myCloud.secure_url
       }
    };

    await user.save();

    return res.status(200).json({success:true,message:"user profile updated successfully"})
      
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const updatePassword = async (req, res) => {
  try {

    const user = await User.findById(req.userId).select("+password")

    const { oldPassword, newPassword } = req.body;

    if( !oldPassword || !newPassword){
      return res.status(400).json({success:false,message:"please enter all fields"});
    }

    const isMatch = await user.comparePassword(oldPassword);
    if(!isMatch){
      return res.status(400).json({success:false,message:"Please enter the correct old password"})
    }

    user.password = newPassword;
    
    await user.save();
    
    return res.status(200).json({success:true,message:"password updated successfully",})
      
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if(!email){
      return res.status(400).json({success:false,message:"please enter registered email"});
    }
    
    const user = await User.findOne({email});
    if(!user){
      return res.status(404).send({success:false,message:"No such user exists"})
    }

    const otp = Math.floor(Math.random() * 1000000);

    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpiry = Date.now() + 15 * 60 * 1000;

    await user.save();

    const message = `Your OTP for resetting the password is ${otp} . If you did not request for this, please ignore this email.`

     await sendMail(email, "Request for Resetting password",message);

    return res.status(200).json({success:true,message:`OTP send to ${email}`,})
      
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { otp,newPassword} = req.body;
    if(!otp){
      return res.status(400).json({success:false,message:"please enter your OTP"});
    }
    
    const user = await User.findOne({resetPasswordOtp:+otp,resetPasswordOtpExpiry:{$gt:Date.now()}}).select("+password")
    if(!user){
      return res.status(404).send({success:false,message:"OTP Invalid or has been Expired"})
    }
    if(!newPassword){
        return res.status(400).json({success:false,message:"password field cannot be Empty"})
    }

    user.password=newPassword;
    user.resetPasswordOtp = null;
    user.resetPasswordOtpExpiry = null;

    await user.save();


    return res.status(200).json({success:true,message:"password changed successfully",})
      
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
};
