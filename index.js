const express = require("express");
// Load node-fetch as an ECMAScript module
import("node-fetch")
  .then((module) => {
    const fetch = module.default;
    // Use the fetch function here
  })
  .catch((error) => {
    console.error(error);
  });
const multer = require("multer");
const ffmpeg = require("@ffmpeg/ffmpeg");
const fs = require("fs");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const https = require("https");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
require("dotenv").config();

// Create a limiter object
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again in a few minutes",
});

const secretkey = process.env.PLAYHT_SECRETKEY;
const userId = process.env.PLAYHT_USERID;

// middleware to parse JSON body
app.use(bodyParser.json());

app.use(cors());

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Update this to your frontend URL in production
  },
});

app.post("/webhook", (req, res) => {
  const event = req.body;

  if (event.status === "SUCCESS") {
    const transcriptionId = event.transcriptionId;
    const status = event.status;
    const voice = event.voice;
    const audioUrl = event.metadata.output[0];

    console.log(
      `Status update for transcription ${transcriptionId}: ${status} (voice: ${voice})`
    );

    if (status === "SUCCESS") {
      console.log(`Audio URL: ${audioUrl}`);

      // Emit the event to the frontend
      io.sockets.emit("audioUrl", { transcriptionId, audioUrl });
    }
  }

  res.status(200).send("OK");
});

app.get("/download/:transcriptionId", async (req, res) => {
  const transcriptionId = req.params.transcriptionId;
  const url = `https://play.ht/api/v1/articleStatus?transcriptionId=${transcriptionId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: secretkey,
      "X-User-ID": userId,
    },
  });
  const data = await response.json();

  const audioUrl = data.audioUrl[0];

  // Set the Content-Disposition header for the download
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="synthesised-audio.wav"'
  );
  res.setHeader("Content-Type", "audio/wav");

  // Stream the audio file directly to the client
  const options = {
    headers: {
      Referer: "https://play.ht/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  };

  https.get(audioUrl, options, (audioResponse) => {
    audioResponse.pipe(res);
  });
});

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// start the server
server.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
