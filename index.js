const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const authRouter = require("./auth");

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);

app.get("/health", (req, res) => {
  res.json({ message: "API is running" });
});

const PORT = process.env.API_PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
