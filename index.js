const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const authRouter = require("./auth");
const profileRouter = require("./profile");

app.use(
  cors({
    origin: "http://localhost:8080",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);

app.get("/health", (req, res) => {
  res.json({ message: "API is running" });
});

const PORT = process.env.API_PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
