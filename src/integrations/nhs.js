require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');

let cachedToken = null;
let tokenExpiry = null;

async function getNhsAccessToken() {
  const now = Date.now();
  if (cachedToken && tokenExpiry && now < tokenExpiry) {
    return cachedToken;
  }

  const data = qs.stringify({
    grant_type: 'client_credentials',
    scope: '',
  });

  try {
    const response = await axios.post(process.env.NHS_TOKEN_URL, data, {
      auth: {
        username: process.env.NHS_CLIENT_ID,
        password: process.env.NHS_CLIENT_SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    cachedToken = response.data.access_token;
    tokenExpiry = now + (response.data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error('Error fetching NHS access token:', error.response?.data || error.message);
    throw error;
  }
}

async function nhsAuthMiddleware(req, res, next) {
  try {
    req.nhsAccessToken = await getNhsAccessToken();
    next();
  } catch (error) {
    res.status(500).send('Failed to authenticate with NHS API');
  }
}

// Get patient appointments
router.get('/appointments', nhsAuthMiddleware, async (req, res) => {
  const patientId = req.query.patientId;
  if (!patientId) return res.status(400).send('Patient ID required');

  try {
    const response = await axios.get(`${process.env.NHS_API_BASE}/appointments`, {
      headers: {
        Authorization: `Bearer ${req.nhsAccessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.NHS_SUBSCRIPTION_KEY,
      },
      params: { patientId },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching appointments:', error.response?.data || error.message);
    res.status(500).send('Failed to fetch appointments');
  }
});

// Book a new appointment
router.post('/appointments', nhsAuthMiddleware, async (req, res) => {
  const appointmentData = req.body;
  try {
    const response = await axios.post(`${process.env.NHS_API_BASE}/appointments`, appointmentData, {
      headers: {
        Authorization: `Bearer ${req.nhsAccessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.NHS_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error booking appointment:', error.response?.data || error.message);
    res.status(500).send('Failed to book appointment');
  }
});

// Get appointment status/details by ID
router.get('/appointments/:id', nhsAuthMiddleware, async (req, res) => {
  try {
    const response = await axios.get(`${process.env.NHS_API_BASE}/appointments/${req.params.id}`, {
      headers: {
        Authorization: `Bearer ${req.nhsAccessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.NHS_SUBSCRIPTION_KEY,
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching appointment details:', error.response?.data || error.message);
    res.status(500).send('Failed to fetch appointment details');
  }
});

// Update an appointment by ID
router.put('/appointments/:id', nhsAuthMiddleware, async (req, res) => {
  const updatedData = req.body;
  try {
    const response = await axios.put(`${process.env.NHS_API_BASE}/appointments/${req.params.id}`, updatedData, {
      headers: {
        Authorization: `Bearer ${req.nhsAccessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.NHS_SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating appointment:', error.response?.data || error.message);
    res.status(500).send('Failed to update appointment');
  }
});

// Cancel an appointment by ID
router.delete('/appointments/:id', nhsAuthMiddleware, async (req, res) => {
  try {
    await axios.delete(`${process.env.NHS_API_BASE}/appointments/${req.params.id}`, {
      headers: {
        Authorization: `Bearer ${req.nhsAccessToken}`,
        'Ocp-Apim-Subscription-Key': process.env.NHS_SUBSCRIPTION_KEY,
      }
    });
    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    console.error('Error cancelling appointment:', error.response?.data || error.message);
    res.status(500).send('Failed to cancel appointment');
  }
});

module.exports = router;
