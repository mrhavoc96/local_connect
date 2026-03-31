import express from "express";
import cors from "cors";
const app = express();

//Basic express  configurations
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended:true, limit: "16kb"}))
app.use(express.static("public"))


// cors configurations
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));

// Import the routes
// import healthCheckRouter from "./modules/healthcheck/healthcheck.router.js";

// Assigning the new endpoint to server on
// app.use("api/v1/healthcheck", healthCheckRouter);

app.get("/", (req, res) => {
  res.send("API running");
});

export default app;

