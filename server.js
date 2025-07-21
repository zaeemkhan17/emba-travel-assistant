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
    console.log("Incoming request:", req.body);

    if (!origin || !destination || !departureDate) {
      console.error("Missing fields");
      return res.status(400).json({ error: "Missing required fields" });
    }

    const token = await getAccessToken();
    console.log("Access token obtained:", token.slice(0, 10) + "...");

    const params = {
  originLocationCode: origin,
  destinationLocationCode: destination,
  departureDate,
  returnDate,
  adults: 1,
  currencyCode: "USD",
  max: 5,
};

console.log("Calling Amadeus with params:", {
  originLocationCode: origin,
  destinationLocationCode: destination,
  departureDate,
  returnDate,
  adults: 1,
  currencyCode: "USD",
  max: 5,
});

const response = await axios.get("https://test.api.amadeus.com/v2/shopping/flight-offers", {
  headers: { Authorization: `Bearer ${token}` },
  params,
});

    console.log("Flight response received.");
    res.json(response.data);
  } catch (err) {
  console.error("Amadeus API error:", err.response?.data || err.message);
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
