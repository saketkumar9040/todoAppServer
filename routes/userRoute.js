import express from "express";
import {
  login,
  register,
  verify,
  logout,
  addTask,
  updateTask,
  removeTask,
  getProfile,
  updateProfile,
  updatePassword,
  forgetPassword,
  resetPassword,
} from "../controllers/userController.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.route("/register").post(register);

router.route("/verify").post(isAuthenticated, verify);

router.route("/login").post(login);

router.route("/logout").get(logout);

router.route("/addTask").post(isAuthenticated, addTask);

router.route("/updateTask/:taskId").get(isAuthenticated, updateTask);

router.route("/removeTask/:taskId").delete(isAuthenticated, removeTask);

router.route("/getProfile").get(isAuthenticated, getProfile);

router.route("/updateProfile").put(isAuthenticated, updateProfile);

router.route("/updatePassword").put(isAuthenticated, updatePassword);

router.route("/forgetPassword").post(forgetPassword);

router.route("/resetPassword").put(resetPassword);

export default router;
