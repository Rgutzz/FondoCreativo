export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const RANGE = "FondoCreativo!A:J";
  const pedidoId = event.queryStringParameters?.id;

  if (!pedidoId) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID faltante" }) };
  }

  try {
    // Leer datos actuales
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

    // 2️Buscar fila con ese ID
    const rowIndex = filas.findIndex(r => r[indexId] === pedidoId);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "ID no encontrado" }) };
    }

    // 3️Actualizar valores
    const newEstado = "Enviado";
    const nuevaFecha = new Date().toLocaleString("es-PE");

    filas[rowIndex][indexEstado] = newEstado;
    filas[rowIndex][indexFecha] = nuevaFecha;

    // 4️Escribir de vuelta toda la tabla
    const updateUrl =
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?valueInputOption=RAW&key=${API_KEY}`;

    const bodyData = { values: filas };

    await fetch(updateUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyData)
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, estado: newEstado, fecha: nuevaFecha })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
