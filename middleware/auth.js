import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Please login to your account" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userExists = await User.findById(decoded._id);
    if (!userExists) {
      return res.status(404).send({ success: false, message: "No user found" });
    }

    req.userId = userExists._id;
    
    next();

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
