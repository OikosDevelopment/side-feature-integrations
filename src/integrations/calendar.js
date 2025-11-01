const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.752883926985-umtto0d0heei85fh6at45blnlcrd9m74.apps.googleusercontent.com,
  process.env.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,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 3: Generate OAuth URL for user consent
router.get('/auth-url', (req, res) => {
  const scopes = ['https://www.googleapis.com/auth/calendar.readonly']; // read-only scope for now

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // enables refresh token to keep access long term
    scope: scopes,
  });

  res.json({ url });
});

// Step 4: Handle OAuth callback and get tokens
router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // You should save tokens in a DB or session; returning here for demo purposes
    res.json(tokens);
  } catch (error) {
    res.status(500).send('Authentication Failed');
  }
});

// Step 5: Use authorized client to list upcoming calendar events
router.get('/events', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json(response.data.items);
  } catch (error) {
    res.status(500).send('Failed to fetch events');
  }
});

module.exports = router;
