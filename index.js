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
const apiKey = process.env.ELEVENLABS_APIKEY;

// middleware to parse JSON body
app.use(bodyParser.json());
app.use(cors());

// GET endpoint to fetch the list of available voices
app.get("/voices", limiter, async (req, res) => {
  try {
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: {
        "X-Api-Key": apiKey,
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
app.post("/text-to-speech/:voice_id", limiter, async (req, res) => {
  const { voice_id } = req.params;
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Text is required" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );
    const data = await response.blob();
    res.send(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// start the server
app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
