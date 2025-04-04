const WebSocket = require("ws");
const express = require("express");
const cors = require("cors");
const http = require("http");

const app = express();
app.use(cors());
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    // console.log(`Received: ${message}`);

    // Broadcast message to all clients, including the sender
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
