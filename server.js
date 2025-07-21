const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json()); // ⬅️ Ensures req.body is parsed correctly

// === Amadeus Token Fetch ===
async function getAccessToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  try {
    const params = new URLSearchParams();
params.append("grant_type", "client_credentials");
params.append("client_id", AMADEUS_CLIENT_ID);
params.append("client_secret", AMADEUS_CLIENT_SECRET);

const response = await axios.post(
  "https://test.api.amadeus.com/v1/security/oauth2/token",
  params.toString(),
  {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

    return response.data.access_token;
  } catch (err) {
    console.error('Failed to get Amadeus token:', err.message);
    throw err;
  }
}

// === Flight Offers ===
app.post('/getFlightOffers', async (req, res) => {
  const { origin, destination, departureDate, returnDate } = req.body;

  console.log('Received /getFlightOffers request:', req.body);

  if (!origin || !destination || !departureDate || !returnDate) {
    return res.status(400).json({
      error: 'Missing required parameters. Make sure to include origin, destination, departureDate, and returnDate.'
    });
  }

  try {
    const token = await getAccessToken();

    const params = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: 1,
      currencyCode: 'USD',
      max: 5
    };

    console.log('Calling Amadeus with params:', params);

    const response = await axios.get('https://test.api.amadeus.com/v2/shopping/flight-offers', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });

    res.json(response.data);
  } catch (err) {
    console.error('Amadeus API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error', details: err.response?.data || err.message });
  }
});

// === Hotel Offers ===
app.post('/getHotelOffers', async (req, res) => {
  const { cityCode, checkInDate, checkOutDate } = req.body;

  console.log('Received /getHotelOffers request:', req.body);

  if (!cityCode || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      error: 'Missing required parameters. Include cityCode, checkInDate, and checkOutDate.'
    });
  }

  try {
    const token = await getAccessToken();

    const params = {
      cityCode,
      checkInDate,
      checkOutDate,
      adults: 1,
      currency: 'USD',
      radius: 30,
      radiusUnit: 'KM',
      bestRateOnly: true,
      roomQuantity: 1
    };

    console.log('Calling Amadeus with params:', params);

    const response = await axios.get('https://test.api.amadeus.com/v2/shopping/hotel-offers', {
      headers: { Authorization: `Bearer ${token}` },
      params
    });

    res.json(response.data);
  } catch (err) {
    console.error('Amadeus API error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Internal server error', details: err.response?.data || err.message });
  }
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
