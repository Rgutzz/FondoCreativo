import { google } from "googleapis";

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const RANGE = "FondoCreativo!A:AB";
  const pedidoId = event.queryStringParameters?.id;

  if (!pedidoId) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID faltante" }) };
  }

  try {
    // Leer credenciales desde el env var
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const jwtClient = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // 1. Leer todas las filas de la hoja
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const filas = readRes.data.values;
    const headers = filas[0];

    // Buscar columnas claves
    const indexId = headers.indexOf("Id");
    const indexEntrega = headers.indexOf("Entrega");

    if (indexId === -1 || indexEntrega === -1) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Faltan columnas Id o Entrega en Google Sheets" })
      };
    }

    // 2. Buscar fila por ID
    const rowIndex = filas.findIndex(r => (r[indexId] || "").trim() === pedidoId);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "Pedido no encontrado" }) };
    }

    // 3. Cambiar estado → ENTREGADO
    filas[rowIndex][indexEntrega] = "ENTREGADO";

    // 4. Actualizar SOLO esa fila exacta
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `FondoCreativo!A${rowIndex + 1}:AB${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [filas[rowIndex]]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        id: pedidoId,
        entrega: "ENTREGADO"
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
