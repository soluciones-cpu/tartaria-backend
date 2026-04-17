const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY;

module.exports = async function handler(req, res) {
  // --- SEGURIDAD CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { token, email, name, phone, planIds } = req.body;

  try {
    const [firstName, ...lastNames] = name ? name.split(' ') : ['Cliente', 'TartarIA'];
    const lastName = lastNames.length > 0 ? lastNames.join(' ') : 'S/A';

    // 1. Crear Cliente en Culqi
    const customerRes = await fetch('https://api.culqi.com/v2/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CULQI_SECRET_KEY}`
      },
      body: JSON.stringify({
        first_name: firstName, last_name: lastName, email: email,
        address: "Av. Principal 123", address_city: "Lima", country_code: "PE",
        phone_number: phone || "999999999"
      })
    });
    const customer = await customerRes.json();
    if (customer.object === 'error') throw customer;

    // 2. Crear Tarjeta
    const cardRes = await fetch('https://api.culqi.com/v2/cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CULQI_SECRET_KEY}`
      },
      body: JSON.stringify({ customer_id: customer.id, token_id: token })
    });
    const card = await cardRes.json();
    if (card.object === 'error') throw card;

    // 3. Crear Suscripciones
    const planes = Array.isArray(planIds) ? planIds : [planIds];
    const suscripcionesCreadas = [];

    for (const planId of planes) {
        if (!planId) continue;
        const subRes = await fetch('https://api.culqi.com/v2/subscriptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CULQI_SECRET_KEY}`
          },
          body: JSON.stringify({ card_id: card.id, plan_id: planId })
        });
        const sub = await subRes.json();
        if (sub.object === 'error') throw sub;
        suscripcionesCreadas.push(sub.id);
    }

    return res.status(200).json({ success: true, subscriptions: suscripcionesCreadas });

  } catch (error) {
    console.error('Error:', error);
    return res.status(400).json({ error: 'Error en la suscripción', details: error });
  }
};
