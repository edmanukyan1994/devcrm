import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import orderRoutes from "./routes/orders";
import taskRoutes from "./routes/tasks";
import commentRoutes from "./routes/comments";
import attachmentRoutes from "./routes/attachments";
import timelineRoutes from "./routes/timeline";
import messagesRoutes from "./routes/messages";
import notificationsRoutes from "./routes/notifications";
import telegramRoutes from "./routes/telegram";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/attachments", attachmentRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/telegram", telegramRoutes);

if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

export default app;
