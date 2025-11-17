import fetch from 'node-fetch';

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const RANGE = "FondoCreativo!A:J";
  const pedidoId = event.queryStringParameters?.id;

  if (!pedidoId) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID faltante" }) };
  }

  try {
    // 1️⃣ leer los datos actuales
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const res = await fetch(readUrl);
    const data = await res.json();

    if (!data.values) {
      return { statusCode: 500, body: JSON.stringify({ error: "No se pudo leer la hoja" }) };
    }

    const filas = data.values;
    const headers = filas[0];

    const indexId = headers.indexOf("id");
    const indexEstado = headers.indexOf("estado");
    const indexFecha = headers.indexOf("fecha");

    // 2️⃣ buscar la fila del pedido
    const rowIndex = filas.findIndex(r => r[indexId] === pedidoId);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "ID no encontrado" }) };
    }

    // 3️⃣ modificar valores
    const newEstado = "Enviado";
    const nuevaFecha = new Date().toLocaleString("es-PE");

    filas[rowIndex][indexEstado] = newEstado;
    filas[rowIndex][indexFecha] = nuevaFecha;

    // 4️⃣ escribir de vuelta
    const updateUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?valueInputOption=RAW&key=${API_KEY}`;

    await fetch(updateUrl, {
      method: "PUT",
      body: JSON.stringify({ values: filas }),
      headers: { "Content-Type": "application/json" }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, estado: newEstado, fecha: nuevaFecha })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
