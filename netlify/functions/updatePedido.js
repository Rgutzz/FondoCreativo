import { google } from "googleapis";

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const RANGE = "FondoCreativo!A:L";
  const pedidoId = event.queryStringParameters?.id;

  if (!pedidoId) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID faltante" }) };
  }

  try {
    // 1️Leer credenciales del environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

    // 2️Crear cliente JWT
    const jwtClient = new google.auth.JWT(
      credentials.client_email,
      null,
      credentials.private_key,
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // 3️Leer toda la hoja
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const filas = readRes.data.values;
    const headers = filas[0];

    const indexId = headers.indexOf("id");
    const indexEstado = headers.indexOf("estado");
    const indexFecha = headers.indexOf("fecha");

    if (indexId === -1 || indexEstado === -1 || indexFecha === -1) {
      return { statusCode: 500, body: JSON.stringify({ error: "Faltan columnas requeridas" }) };
    }

    // 4Buscar fila por ID
    const rowIndex = filas.findIndex(r => r[indexId] === pedidoId);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "ID no encontrado" }) };
    }

    // 5️Actualizar datos
    const nuevoEstado = "Enviado";
    const nuevaFecha = new Date().toLocaleString("es-PE");

    filas[rowIndex][indexEstado] = nuevoEstado;
    filas[rowIndex][indexFecha] = nuevaFecha;

    // 6️Escribir de vuelta toda la hoja
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: "RAW",
      requestBody: {
        values: filas,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, estado: nuevoEstado, fecha: nuevaFecha }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
