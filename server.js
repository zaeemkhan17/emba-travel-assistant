// server.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;

// Toggle this flag to switch between environments
const USE_PRODUCTION = false;

const AMADEUS_AUTH_URL = USE_PRODUCTION
  ? 'https://api.amadeus.com/v1/security/oauth2/token'
  : 'https://test.api.amadeus.com/v1/security/oauth2/token';

const AMADEUS_FLIGHT_URL = USE_PRODUCTION
  ? 'https://api.amadeus.com/v2/shopping/flight-offers'
  : 'https://test.api.amadeus.com/v2/shopping/flight-offers';

const AMADEUS_CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
const AMADEUS_CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

app.post('/getFlightOffers', async (req, res) => {
  console.log('Received /getFlightOffers request:', req.body);
  const { origin, destination, departureDate, returnDate } = req.body;

  try {
    // Step 1: Get OAuth2 token from Amadeus
    const tokenResponse = await axios.post(
      AMADEUS_AUTH_URL,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CLIENT_ID,
        client_secret: AMADEUS_CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const token = tokenResponse.data.access_token;

    // Step 2: Call flight offers API
    const flightParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      returnDate,
      adults: 1,
      currencyCode: 'USD',
      max: 5,
    };

    console.log('Calling Amadeus with params:', flightParams);

    const flightResponse = await axios.get(AMADEUS_FLIGHT_URL, {
      headers: { Authorization: `Bearer ${token}` },
      params: flightParams,
    });

    res.json(flightResponse.data);
  } catch (error) {
    console.error('Amadeus API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch flight offers' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

// === Hotel Offers ===
app.post('/getHotelOffers', async (req, res) => {
  const { cityCode, checkInDate, checkOutDate } = req.body;
  console.log('Received /getHotelOffers request:', req.body);

  try {
    // Step 1: Get Amadeus access token
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', AMADEUS_CLIENT_ID);
    tokenParams.append('client_secret', AMADEUS_CLIENT_SECRET);

    const tokenResponse = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      tokenParams.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Step 2: Call Amadeus hotel offers API
    const amadeusResponse = await axios.get('https://test.api.amadeus.com/v2/shopping/hotel-offers', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        cityCode: cityCode,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        adults: 1,
        roomQuantity: 1,
        currency: 'USD',
        bestRateOnly: true,
        radius: 50
      }
    });

    res.json(amadeusResponse.data);
  } catch (error) {
    console.error('Amadeus Hotel API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch hotel offers' });
  }
});
