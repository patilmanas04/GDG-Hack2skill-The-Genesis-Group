const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const http = require("http");
const dotenv = require("dotenv");
const processRoutes = require("./routes/pdfRoutes");

dotenv.config();

const app = express();
app.use(cors());

app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use("/api", processRoutes);

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => console.log("Client disconnected"));
});

server.listen(8080, () => {
  console.log("Server running on http://localhost:8080");
});
