// netlify/functions/getVentas.js

export async function handler(event) {
  const SHEET_ID = "14JOAkWEe5IzURpCwchlYQhzWkROL66ghDfKMFhl2-nQ";
  const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

  try {
    // Traer VENTAS
    const urlVentas = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Ventastotal!A:AB?key=${API_KEY}`;
    const resVentas = await fetch(urlVentas);
    if (!resVentas.ok) throw new Error("Error al leer Ventastotal");
    
    const dataVentas = await resVentas.json();
    if (!dataVentas.values) throw new Error("Ventastotal vacía");
    
    const filasVentas = dataVentas.values;
    const headersVentas = filasVentas.shift();
    const ventas = filasVentas.map(r => {
      let obj = {};
      headersVentas.forEach((h, i) => {
        obj[h] = r[i] || "";
      });
      return obj;
    });

    // Traer GASTOS
    const urlGastos = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Gastos!A:J?key=${API_KEY}`;
    let gastos = [];

try {

  const resGastos = await fetch(urlGastos);

  if (resGastos.ok) {

    const dataGastos = await resGastos.json();

    const filasGastos = dataGastos.values
      ? [...dataGastos.values]
      : [];

    const headersGastos =
      filasGastos.length > 0
        ? filasGastos.shift()
        : [];

    gastos = filasGastos.map(r => {

      let obj = {};

      headersGastos.forEach((h, i) => {
        obj[h] = r[i] || "";
      });

      return obj;

    });

  } else {

    console.log("No se pudo leer Gastos");

  }

} catch(err) {

  console.log("Error en Gastos:", err.message);

}
  }
}
