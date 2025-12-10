import { config } from "dotenv";

import app from "./app.js";
import connectToDB from "./config/db.config.js";

config();
connectToDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
