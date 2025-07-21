const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const AMADEUS_CLIENT_ID = "NAmg8wPrqGt2zsaLQBOWfDEiVGhXdrCP";
const AMADEUS_CLIENT_SECRET = "8cSLcbcQVqpxrxKO";

let cachedToken = null;
let tokenExpiry = null;

async function getAccessToken() {
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const response = await axios.post(
    "https://test.api.amadeus.com/v1/security/oauth2/token",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    })
  );

  cachedToken = response.data.access_token;
  tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000;
  return cachedToken;
}

app.post("/getFlightOffers", async (req, res) => {
  try {
    const { origin, destination, departureDate, returnDate } = req.body;

    // Step 1: Log the incoming request
    console.log("Incoming request:", req.body);

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = await getAccessToken();

    // Step 2: Log the token and Amadeus request
    console.log("Access Token:", token);
    console.log("Calling Amadeus API...");

    const response = await axios.get("https://test.api.amadeus.com/v2/shopping/flight-offers", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate,
        returnDate,
        adults: 1,
        currencyCode: "USD",
        max: 5,
      },
    });

    // Step 3: Log the response
    console.log("Amadeus response:", response.data);

    res.json(response.data);
  } catch (err) {
    // Step 4: Log the error details
    console.error("Error fetching flight offers:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.post("/getHotelOffers", async (req, res) => {
  try {
    const { cityCode, checkInDate, checkOutDate } = req.body;

    if (!cityCode || !checkInDate || !checkOutDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = await getAccessToken();
    const response = await axios.get("https://test.api.amadeus.com/v2/shopping/hotel-offers", {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        cityCode,
        checkInDate,
        checkOutDate,
        adults: 1,
        currency: "USD",
        roomQuantity: 1,
      },
    });

    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("EMBA Travel Assistant Backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
