import express from "express";
import router from "./routes/userRoute.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import cors from "cors"

export const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload({ useTempFiles: true, tempFileDir: `${process.cwd()}/temperoryImages/` }));
app.use(cors());

app.use("/api/v1",  router); 

app.get("/",(req,res)=>{
    res.send("Server is Working")
});