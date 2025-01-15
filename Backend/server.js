const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
  res.send('Hello World');
});

// Google Calendar API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URL
);

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Route to authenticate with Google
app.get('/auth', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/calendar'];
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
  res.redirect(url);
});

// Route to handle OAuth2 callback
app.get('/auth/redirect', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    res.send('Authentication successful! Return to the app.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Authentication failed.');
  }
});

// Route to create an event
app.post('/create-event', async (req, res) => {
  const { text } = req.body;

  // Parse the input `text` to extract event details
  const event = {
    summary: 'Parsed Event',
    location: 'Google Meet',
    description: 'An event created from parsed input.',
    start: {
      dateTime: '2025-01-14T19:30:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    end: {
      dateTime: '2025-01-14T20:30:00+05:30',
      timeZone: 'Asia/Kolkata',
    },
    attendees: [{ email: ['shalini.moorthyai@gmail.com', 'shalinimoorthy88@gmail.com']}],
  };

  try {
    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
    });

    res.json({
      status: 200,
      message: 'Event created successfully!',
      link: result.data.htmlLink,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
