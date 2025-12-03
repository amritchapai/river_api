import express from "express";
import cors from "cors";
import helmet from "helmet";
import riverRoutes from "./routes/rivers.routes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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
  res.json({ status: "running" });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "endpoint_not_found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

export default app;
