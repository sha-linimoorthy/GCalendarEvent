const express = require('express');
const { PublicClientApplication } = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');

const app = express();
const port = 8000;
require('dotenv').config();
const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID,
    authority: process.env.AUTHORITY,
    clientSecret: process.env.CLIENT_SECRET,
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

app.use(express.json());

app.get('/outlook/auth/login', async (req, res) => {
  try {
    const authUrl = await msalInstance.getAuthCodeUrl({
      scopes: ['user.read'],
      redirectUri: process.env.REDIRECT_URI,
    });
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).send('Error generating auth URL');
  }
});


app.post('/outlook/auth/token', async (req, res) => {
  const token = await msalInstance.acquireTokenByCode({
    scopes: ['user.read', 'onlineMeetings.ReadWrite'],
    code: req.body.code,
    redirectUri: process.env.REDIRECT_URI
  });
  res.json(token);
});

app.get('/outlook/auth/redirect', async (req, res) => {
    try {
      const tokenResponse = await msalInstance.acquireTokenByCode({
        scopes: ['user.read'],
        code: req.query.code,
        redirectUri: process.env.REDIRECT_URI,
      });
  
      // Redirect the user to the frontend with the token or user information
      res.redirect(`http://localhost:3000?access_token=${tokenResponse.accessToken}`);
    } catch (error) {
      console.error('Error acquiring token:', error);
      res.status(500).send('Error acquiring token');
    }
  });

app.post('/meetings/create', async (req, res) => {
  const client = Client.initWithMiddleware({
    authProvider: {
      getAccessToken: () => req.body.accessToken,
    },
  });

  const startTime = new Date().toISOString();
  const endTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const meeting = await client.api('/me/onlineMeetings').post({
    startDateTime: startTime,
    endDateTime: endTime,
    subject: 'New Teams Meeting',
  });

  res.json(meeting);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
