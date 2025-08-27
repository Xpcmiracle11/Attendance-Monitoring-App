require("dotenv").config();
const os = require("os");
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const ZKLib = require("zklib-js");
const db = require("./config/db");
const cron = require("node-cron");
const { startBiometricCronJob } = require("./controllers/attendanceController");
const authRoutes = require("./routes/authRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const truckRoutes = require("./routes/truckRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const breakRoutes = require("./routes/breakRoutes");
const deviceRoutes = require("./routes/deviceRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const orderRoutes = require("./routes/orderRoutes");
const holidayRoutes = require("./routes/holidayRoutes");
const chartRoutes = require("./routes/chartRoutes");

const app = express();
const server = http.createServer(app);

const FRONTEND_ORIGIN = "http://172.16.1.24:5174";

app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

app.use(express.json());
app.use("/uploads", express.static(path.resolve(__dirname, "./uploads")));

app.use("/api/", authRoutes);
app.use("/api/", departmentRoutes);
app.use("/api/", userRoutes);
app.use("/api/", truckRoutes);
app.use("/api/", monitoringRoutes);
app.use("/api/", attendanceRoutes);
app.use("/api/", breakRoutes);
app.use("/api/", deviceRoutes);
app.use("/api/", payrollRoutes);
app.use("/api/", orderRoutes);
app.use("/api/", holidayRoutes);
app.use("/api/", chartRoutes);
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

const sanitizeName = (str) =>
  str.replace(/[^a-zA-Z0-9 ]/g, "").substring(0, 24);

const syncUsersAcrossAllDevices = () => {
  db.query("SELECT * FROM biometric_devices", async (err, devices) => {
    if (err || !devices.length) {
      console.error("❌ Failed to fetch biometric devices or none found:", err);
      return;
    }

    for (const sourceDevice of devices) {
      const source = new ZKLib(
        sourceDevice.ip_address,
        Number(sourceDevice.port),
        5200,
        5000
      );
      try {
        await source.createSocket();
        const users = await source.getUsers();

        // console.log(
        //   `\n🧾 Users fetched from ${sourceDevice.name} (${sourceDevice.ip_address}):`
        // );
        // console.dir(users, { depth: null });

        for (const targetDevice of devices) {
          if (targetDevice.ip_address === sourceDevice.ip_address) continue;

          const target = new ZKLib(
            targetDevice.ip_address,
            Number(targetDevice.port),
            5200,
            5000
          );
          try {
            await target.createSocket();

            for (const user of users.data) {
              const uid = user.uid ?? 0;
              const userId = user.userId ?? String(uid);
              const password = user.password ?? "";
              const role = user.role ?? 0;
              const cardno = user.cardno ?? 0;

              const [dbUser] = await new Promise((resolve) => {
                db.query(
                  `SELECT first_name FROM users WHERE id = ?`,
                  [userId],
                  (err, results) => {
                    if (err || results.length === 0) resolve([]);
                    else resolve(results);
                  }
                );
              });

              if (!dbUser) continue;

              const name = sanitizeName(dbUser.first_name || "Unknown");

              // console.log(
              //   `➡️ Syncing user ${userId} (${name}) to ${targetDevice.name} (${targetDevice.ip_address})`
              // );
              try {
                const result = await target.setUser(
                  uid,
                  userId,
                  name,
                  password,
                  role,
                  cardno
                );
                // console.log(
                //   `✅ setUser result for user ${userId} on ${targetDevice.name}:`,
                //   result
                // );
              } catch (setErr) {
                console.error(
                  `❌ setUser failed for user ${userId} on ${targetDevice.name}:`,
                  setErr.message
                );
              }
            }

            await target.disconnect();
            // console.log(
            //   `✅ Finished syncing to ${targetDevice.name} (${targetDevice.ip_address})`
            // );
          } catch (err) {
            console.error(
              `❌ Failed to sync to ${targetDevice.name}:`,
              err.message
            );
          }
        }

        await source.disconnect();
      } catch (err) {
        console.error(
          `❌ Error with source device ${sourceDevice.name}:`,
          err.message
        );
      }
    }
  });
};

cron.schedule("*/5 * * * *", () => {
  // console.log(
  //   "🔄 Starting scheduled user sync across all biometric devices..."
  // );
  syncUsersAcrossAllDevices();
});

const localIP = getLocalIP();
const PORT = process.env.PORT || 8080;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running at http://${localIP}:${PORT}`);
  syncUsersAcrossAllDevices();
  startBiometricCronJob();
});
