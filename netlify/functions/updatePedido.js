import { google } from "googleapis";

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const RANGE = "FondoCreativo!A:L";
  const pedidoId = event.queryStringParameters?.id;

  if (!pedidoId) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID faltante" }) };
  }

  try {
    // Leer credenciales del env var
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    const jwtClient = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // 1. Leer toda la hoja
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const filas = readRes.data.values;
    const headers = filas[0];

    // Indices de columnas
    const indexId = headers.indexOf("id");
    const indexEstado = headers.indexOf("estado");
    const indexFechaEnvio = headers.indexOf("fechaenvio");

    if (indexId === -1 || indexEstado === -1 || indexFechaEnvio === -1) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Faltan columnas en Google Sheets" })
      };
    }

    // 2. Buscar fila por ID
    const rowIndex = filas.findIndex(r => (r[indexId] || "").trim() === pedidoId);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "Pedido no encontrado" }) };
    }

    // 3. Actualizar solo estado y fechaenvio
    const nuevaFechaEnvio = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });

    filas[rowIndex][indexEstado] = "Enviado";
    filas[rowIndex][indexFechaEnvio] = nuevaFechaEnvio;

    // 4. Actualizar solo esa fila (más eficiente)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `FondoCreativo!A${rowIndex + 1}:L${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [filas[rowIndex]]
      }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        estado: "Enviado",
        fechaenvio: nuevaFechaEnvio
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
