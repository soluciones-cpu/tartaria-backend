module.exports = (req, res) => {
  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Seguro - TartarIA</title>
      <script src="https://checkout.culqi.com/js/v4"></script>
      <style>
          body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f8fafc; margin: 0; flex-direction: column; }
          .loader { border: 4px solid #f3f3f3; border-top: 4px solid #f59e0b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px;}
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h2 { color: #1e293b; font-size: 18px; text-align: center; margin-bottom: 5px;}
          p { color: #64748b; font-size: 14px; text-align: center; max-width: 80%;}
          .btn { padding: 10px 20px; background: #f59e0b; border: none; color: white; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px; display: none; }
      </style>
  </head>
  <body>
      <div class="loader" id="spinner"></div>
      <h2 id="status">Iniciando pasarela segura...</h2>
      <p id="substatus">Por favor, no cierres esta ventana.</p>
      <button class="btn" id="retry-btn" onclick="Culqi.open()">Reintentar Pago</button>

      <script>
          // 1. Decodificar la maleta de seguridad de Lovable
          const urlParams = new URLSearchParams(window.location.search);
          let amount = 0, email = '', name = '', phone = '', planIds = [];

          try {
              if (urlParams.has('data')) {
                  let dataStr = urlParams.get('data');
                  // AQUÍ ESTÁ LA MAGIA: Desencriptamos el Base64 que mandó Lovable
                  let parsedStr = decodeURIComponent(atob(dataStr));
                  let parsed = JSON.parse(parsedStr);
                  
                  amount = parsed.amount || parsed.total || 0;
                  email = parsed.customerEmail || parsed.email || '';
                  name = parsed.customerName || parsed.name || '';
                  phone = parsed.phone || parsed.customerPhone || '';
                  planIds = parsed.planIds || parsed.plans || [];
              }
          } catch(e) {
              console.error("Error leyendo datos del carrito", e);
          }

          // 2. Configurar Culqi
          Culqi.publicKey = 'pk_live_GoS2dd3xMabcEJVx'; 
          Culqi.settings({
              title: 'TartarIA Solutions',
              currency: 'USD',
              amount: amount, 
          });
          Culqi.options({
              lang: 'auto',
              installments: false,
              paymentMethods: { tarjeta: true, yape: false, billetera: false, bancaMovil: false }
          });

          // 3. Abrir Culqi
          setTimeout(() => { Culqi.open(); }, 800);

          // 4. Capturar token
          function culqi() {
              if (Culqi.token) {
                  const token = Culqi.token.id;
                  document.getElementById('status').innerText = "Creando suscripciones...";
                  document.getElementById('substatus').innerText = "Estamos conectando con el banco, un momento...";
                  document.getElementById('retry-btn').style.display = 'none';
                  document.getElementById('spinner').style.display = 'block';
                  
                  fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token, email, name, phone, planIds })
                  })
                  .then(res => res.json())
                  .then(data => {
                      if(data.success) {
                          document.getElementById('status').innerText = "¡Pago Exitoso!";
                          document.getElementById('substatus').innerText = "Ventana cerrándose...";
                          document.getElementById('spinner').style.display = 'none';
                          
                          window.opener.postMessage('PAYMENT_SUCCESS', '*');
                          setTimeout(() => window.close(), 1500);
                      } else {
                          throw new Error(data.error || "La tarjeta fue rechazada");
                      }
                  })
                  .catch(err => {
                      document.getElementById('status').innerText = "Error en el cobro";
                      document.getElementById('substatus').innerText = err.message;
                      document.getElementById('spinner').style.display = 'none';
                      document.getElementById('retry-btn').style.display = 'block';
                  });

              } else {
                  document.getElementById('status').innerText = "Pago pendiente";
                  document.getElementById('substatus').innerText = (Culqi.error && Culqi.error.user_message) ? Culqi.error.user_message : "La validación fue cancelada.";
                  document.getElementById('spinner').style.display = 'none';
                  document.getElementById('retry-btn').style.display = 'block';
              }
          }
      </script>
  </body>
  </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
};
