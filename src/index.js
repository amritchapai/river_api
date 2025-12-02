import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import riverRoutes from "./routes/rivers.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectDB();

//river routes
app.use("/api/rivers", riverRoutes);

app.get("/", (req, res) => {
  res.json({
    name: "river_api",
    description: "Api endpoints for river api",
    endpoints: {
      find_rivers:
        "GET /api/rivers/nearby?lat={latitude}&lng={longitude}&radius={km}",
      health_check: "GET /health",
    },
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "endpoint_not _ound",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
