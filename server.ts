import { app } from "./app";
import connectDb from "./utils/db";
require("dotenv").config();

const PORT = process.env.PORT as string;

app.listen(PORT, () => {
  console.log(`server is listening at port ${PORT}`);
  connectDb();
});
