require("dotenv").config();
const os = require("os");
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");

const { startBiometricCronJob } = require("./controllers/attendanceController");

// Import your routes
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const truckRoutes = require("./routes/truckRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const breakRoutes = require("./routes/breakRoutes");
const dispatchRoutes = require("./routes/dispatchRoutes");
const tripRoutes = require("./routes/tripRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const loanRoutes = require("./routes/loanRoutes");
const contributionRoutes = require("./routes/contributionRoutes");

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = "http://172.16.1.27:5174";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "./uploads")));

// ✅ Routes
app.use("/api/", authRoutes);
app.use("/api/", departmentRoutes);
app.use("/api/", userRoutes);
app.use("/api/", truckRoutes);
app.use("/api/", monitoringRoutes);
app.use("/api/", attendanceRoutes);
app.use("/api/", breakRoutes);
app.use("/api/", dispatchRoutes);
app.use("/api/", tripRoutes);
app.use("/api/", deviceRoutes);
app.use("/api/", payrollRoutes);
app.use("/api/", loanRoutes);
app.use("/api/", contributionRoutes);
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const io = new socketIo.Server(server, {
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("✅ New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (let iface of Object.values(interfaces)) {
    for (let config of iface) {
      if (config.family === "IPv4" && !config.internal) {
        return config.address;
      }
    }
  }
  return "localhost";
};

const localIP = getLocalIP();
const PORT = process.env.PORT || 8080;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://${localIP}:${PORT}`);
  startBiometricCronJob();
});
