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

const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

require("dotenv").config();

// Create a limiter object
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again in a few minutes",
});

const app = express();
const secretkey = process.env.PLAYHT_SECRETKEY;
const userId = process.env.PLAYHT_USERID;

const corsOptions = {
  origin: "http://localhost:1234",
  optionsSuccessStatus: 200,
};

// middleware to parse JSON body
app.use(bodyParser.json());
app.use(cors(corsOptions));

// GET endpoint to fetch the list of available voices
app.get("/voices", limiter, async (req, res) => {
  const url = "https://play.ht/api/v1/getVoices?ultra=true";

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretkey,
        "X-User-ID": userId,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST endpoint to convert text to speech
app.post("/convert", async (req, res) => {
  const url = "https://play.ht/api/v1/convert";
  const { voice, content } = req.body;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretkey,
        "X-User-ID": userId,
      },
      body: JSON.stringify({ voice, content }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/articleStatus/:transcriptionId", async (req, res) => {
  const transcriptionId = req.params.transcriptionId;
  const url = `https://play.ht/api/v1/articleStatus?transcriptionId=${transcriptionId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: secretkey,
        "X-User-ID": userId,
      },
    });

    const data = await response.json();
    res.json(data.audioUrl[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// start the server
app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
