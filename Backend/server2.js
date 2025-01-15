const msal = require("@azure/msal-node");
const axios = require("axios");
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const express = require("express");
const app = express();
const session = require('express-session');
const cors = require('cors'); 
app.use(express.json());
app.use(cors());
dotenv.config();

app.use(bodyParser.json());  

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true
}));

const port = process.env.PORT || 8000;

const config = {
    auth: {
      clientId: process.env.CLIENT_ID,
      authority: 'https://login.microsoftonline.com/common',
      clientSecret: process.env.CLIENT_SECRET,
    },
    system: {
      loggerOptions: {
        loggerCallback(logLevel, message, containsPii) {
          console.log(message);  // Log everything for debugging
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose
      }
    }
  };  

const cca = new msal.ConfidentialClientApplication(config);

app.get('/outlook/auth', async (req, res) => {
  try {
    const authUrl = await cca.getAuthCodeUrl({
      scopes: ['Calendars.ReadWrite'],
      redirectUri: process.env.REDIRECT_URL,
    });
    res.redirect(authUrl);
  } catch (err) {
    console.error("Error generating auth URL:", err);
    res.status(500).send("Error generating authentication URL");
  }
});

app.get('/outlook/auth/redirect', async (req, res) => {
  const tokenRequest = {
    code: req.query.code,
    scopes: ['Calendars.ReadWrite'],
    redirectUri: process.env.REDIRECT_URL,
  };

  try {
    const tokenResponse = await cca.acquireTokenByCode(tokenRequest);
    req.session.accessToken = tokenResponse.accessToken; // Save token
    res.send("Authentication successful! You can now create events.");
  } catch (err) {
    console.error("Token acquisition error:", err);
    res.status(500).send("Authentication failed.");
  }
});


async function parseWithLLM(inputText) {
    const llmApiUrl = "http://127.0.0.1:5000/generate/parser"; 
  
    try {
      const response = await axios.post(
        llmApiUrl,
        { text: inputText },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
  
      const jsonResponse = response.data.response;
  
      const cleanedJsonString = jsonResponse.replace(/```json\n|\n```/g, '').trim();
  
      const parsedData = JSON.parse(cleanedJsonString);
  
      console.log(parsedData); 
  
      return parsedData; 
      
    } catch (err) {
      console.error("Error calling LLM API:", err.message);
      throw new Error("Failed to parse input text using LLM API.");
    }
  }

  app.post('/create-event', async (req, res) => {
    const { text } = req.body;
  
    try {
      const parsedData = await parseWithLLM(text);
        const event = {
        subject: parsedData.summary || "Default Summary",
        body: {
          contentType: "HTML",
          content: parsedData.description || "No description provided",
        },
        start: {
          dateTime: parsedData.startDateTime,
          timeZone: "Asia/Kolkata",
        },
        end: {
          dateTime: parsedData.endDateTime || parsedData.startDateTime,
          timeZone: "Asia/Kolkata",
        },
        attendees: parsedData.attendees
          ? parsedData.attendees.map((email) => ({ emailAddress: { address: email }, type: "required" }))
          : [],
      };
  
      const response = await axios.post(
        "https://graph.microsoft.com/v1.0/me/events",
        event,
        {
          headers: {
            Authorization: `Bearer ${req.session.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
  
      res.json({
        status: 200,
        message: "Event created successfully!",
        link: response.data.webLink,
      });
    } catch (err) {
      console.error("Error creating event:", err);
      res.status(500).json({ message: "Failed to create event", error: err.message });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
