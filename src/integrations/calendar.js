const { google } = require('googleapis');
const express = require('express');
const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate OAuth URL for user consent
router.get('/auth-url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
  ]; // Full calendar access

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.json({ url });
});

// Handle OAuth callback and get tokens
router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Store tokens properly for a real app here
    res.json(tokens);
  } catch (error) {
    console.error(error);
    res.status(500).send('Authentication Failed');
  }
});

// List calendars for the user
router.get('/calendars', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();
    res.json(response.data.items);
  } catch (error) {
    res.status(500).send('Failed to list calendars');
  }
});

// List upcoming events from primary calendar
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

// Create a calendar event
router.post('/events', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const event = {
      summary: req.body.summary,
      description: req.body.description,
      location: req.body.location,
      start: { dateTime: req.body.startDateTime },
      end: { dateTime: req.body.endDateTime },
      attendees: req.body.attendees, // Array of { email: "attendee@example.com" }
      reminders: {
        useDefault: false,
        overrides: req.body.reminders || [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    };
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create event');
  }
});

// Update a calendar event
router.patch('/events/:id', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const updatedEvent = {
      summary: req.body.summary,
      description: req.body.description,
      location: req.body.location,
      start: { dateTime: req.body.startDateTime },
      end: { dateTime: req.body.endDateTime },
      attendees: req.body.attendees,
      reminders: {
        useDefault: false,
        overrides: req.body.reminders,
      },
    };
    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: req.params.id,
      resource: updatedEvent,
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to update event');
  }
});

// Delete a calendar event
router.delete('/events/:id', async (req, res) => {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: req.params.id,
    });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to delete event');
  }
});

module.exports = router;
