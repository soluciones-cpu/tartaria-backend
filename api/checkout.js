const axios = require('axios');

export default async function handler(req, res) {
  // Configuración de CORS para permitir peticiones desde tu frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, amount, email, description } = req.body;

  try {
    // Llamada a la API de Culqi para procesar el cargo
    const culqiResponse = await axios.post(
      'https://api.culqi.com/v2/charges',
      {
        amount: amount, // En céntimos
        currency_code: 'USD', // Cambia a 'PEN' si cobras en soles
        email: email,
        source_id: token,
        description: description
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.CULQI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.status(200).json({ success: true, charge: culqiResponse.data });
  } catch (error) {
    console.error('Error de Culqi:', error.response?.data || error.message);
    res.status(400).json({ 
      success: false,
      message: error.response?.data?.user_message || 'Error procesando el pago'
    });
  }
}
