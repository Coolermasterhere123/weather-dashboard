module.exports = function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  
  res.status(200).json({
    openweather_api_key: process.env.OPENWEATHER_API_KEY || '',
    groq_api_key: process.env.GROQ_API_KEY || ''
  });
};