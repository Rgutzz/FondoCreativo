// netlify/functions/getVentas.js

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const RANGE = "Ventastotal!A:AB";

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const res = await fetch(url);

    if (!res.ok) {
      return { statusCode: res.status, body: JSON.stringify({ error: "Error al leer la hoja" }) };
    }

    const data = await res.json();
    if (!data.values) {
      return { statusCode: 500, body: JSON.stringify({ error: "Hoja vacía" }) };
    }

    const filas = data.values;
    const headers = filas.shift();

    const pedidos = filas.map(r => {
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = r[i] || "";
      });
      return obj;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(pedidos)
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
