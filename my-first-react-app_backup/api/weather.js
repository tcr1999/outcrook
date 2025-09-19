export default async function handler(request, response) {
  // Ensure the API key is securely loaded from environment variables
  const API_KEY = process.env.TOMORROW_IO_API_KEY;

  if (!API_KEY) {
    return response.status(500).json({ error: 'Server configuration error: API key is missing.' });
  }

  // Extract query parameters from the request to this serverless function
  const { latitude, longitude, timesteps, type } = request.query;

  if (!latitude || !longitude || !timesteps || !type) {
    return response.status(400).json({ error: 'Missing required query parameters (latitude, longitude, timesteps, type).' });
  }

  let tomorrowIoUrl = '';

  // Construct the correct Tomorrow.io API URL based on the 'type' parameter
  if (type === 'realtime') {
    tomorrowIoUrl = `https://api.tomorrow.io/v4/weather/realtime?location=${latitude},${longitude}&units=metric&apikey=${API_KEY}`;
  } else if (type === 'forecast') {
    tomorrowIoUrl = `https://api.tomorrow.io/v4/weather/forecast?location=${latitude},${longitude}&timesteps=${timesteps}&units=metric&apikey=${API_KEY}`;
  } else {
    return response.status(400).json({ error: 'Invalid weather data type requested.' });
  }

  try {
    const apiResponse = await fetch(tomorrowIoUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'accept-encoding': 'deflate, gzip, br',
      },
    });

    if (!apiResponse.ok) {
      // Attempt to parse API error message for better debugging
      const errorData = await apiResponse.json();
      console.error(`Tomorrow.io API Error (${type}):`, apiResponse.status, errorData);
      return response.status(apiResponse.status).json({
        error: `Failed to fetch data from Tomorrow.io API (${type}): ${errorData.message || 'Unknown error'}`,
        details: errorData,
      });
    }

    const data = await apiResponse.json();
    return response.status(200).json(data);

  } catch (error) {
    console.error('Serverless Function Error:', error);
    return response.status(500).json({ error: 'Internal serverless function error.', details: error.message });
  }
}
