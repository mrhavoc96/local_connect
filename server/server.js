require("dotenv").config();
const express = require("express");

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// debug logs
console.log("PORT:", process.env.PORT);
console.log("DB Name:", process.env.DB_NAME);

// server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.json({ status: "API is running" });
});
