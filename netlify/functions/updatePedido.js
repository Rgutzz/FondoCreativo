// netlify/functions/updatePedido.js

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
  const RANGE = "FondoCreativo!A:J"; 

   const id = event.queryStringParameters?.id?.trim();
  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: "ID faltante" }) };
  }

  try {
    // 1) Leer la hoja completa
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const readRes = await fetch(readUrl);

    if (!readRes.ok) {
      return { statusCode: readRes.status, body: JSON.stringify({ error: "Error al leer la hoja" }) };
    }

    const data = await readRes.json();
    const rows = data.values;
    const headers = rows.shift();

    const iCodigo = headers.indexOf("id");
    const iEstado = headers.indexOf("estado");
    const iFecha = headers.indexOf("fecha");

    if (iCodigo === -1 || iEstado === -1) {
      return { statusCode: 500, body: JSON.stringify({ error: "Columnas 'id' o 'estado' no existen" }) };
    }

    const rowIndex = rows.findIndex(r => (r[iCodigo] || "").trim() === id);

    if (rowIndex === -1) {
      return { statusCode: 404, body: JSON.stringify({ error: "Código no encontrado" }) };
    }

    const sheetRow = rowIndex + 2;

    const now = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" });

    const updateBody = {
      valueInputOption: "USER_ENTERED",
      data: [
        {
          range: `Fondo Creativo!${col(iEstado)}${sheetRow}`,
          values: [["Enviado"]]
        },
        {
          range: `Fondo Creativo!${col(iFecha)}${sheetRow}`,
          values: [[now]]
        }
      ]
    };

    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate?key=${API_KEY}`;
    const writeRes = await fetch(writeUrl, {
      method: "POST",
      body: JSON.stringify(updateBody)
    });

    if (!writeRes.ok) {
      return { statusCode: writeRes.status, body: JSON.stringify({ error: "Error al actualizar hoja" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Pedido actualizado a Enviado" })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}

function col(n) {
  let s = "";
  n++;
  while (n > 0) {
    let r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - r - 1) / 26);
  }
  return s;
}