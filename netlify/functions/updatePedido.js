import { google } from 'googleapis';

export async function handler(event) {
  try {
    const id = event.queryStringParameters.id;
    if (!id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "ID faltante" })
      };
    }

    // Cargar credenciales del Service Account
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const jwt = new google.auth.JWT(
      creds.client_email,
      null,
      creds.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth: jwt });

    const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
    const RANGE = "FondoCreativo!A:L";

    // 1. Leer todas las filas
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = readRes.data.values;
    const headers = rows[0];
    const idIndex = headers.indexOf("id");
    const estadoIndex = headers.indexOf("estado");
    const fechaEnvioIndex = headers.indexOf("fechaenvio");

    // Buscar la fila correcta
    const rowIndex = rows.findIndex(r => (r[idIndex] || "").trim() === id);

    if (rowIndex === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Pedido no encontrado." })
      };
    }

    // Actualizar estado y fecha de envío
    const now = new Date();
    const fechaEnvio = now.toLocaleString("es-PE", { timeZone: "America/Lima" });

    // Actualizar valores
    rows[rowIndex][estadoIndex] = "Enviado";
    rows[rowIndex][fechaEnvioIndex] = fechaEnvio;

    // 3. Subir la fila actualizada
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `FondoCreativo!A${rowIndex + 1}:L${rowIndex + 1}`,
      valueInputOption: "RAW",
      requestBody: { values: [rows[rowIndex]] }
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
