import { app } from "./app";
import connectDb from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
import http from "http";
require("dotenv").config();
import { initSocketServer } from "./socketServer";

const PORT = process.env.PORT as string;
const server = http.createServer(app);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

initSocketServer(server);

server.listen(PORT, () => {
  console.log(`server is listening at port ${PORT}`);
  connectDb();
});
