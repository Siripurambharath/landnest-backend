const pool = require("./db2");

async function seed() {

  const batchSize = 500;

  const total = 10000000;

  for (let i = 0; i < total; i += batchSize) {

    const placeholders = [];

    const values = [];

    for (let j = 0; j < batchSize; j++) {

      const lat = 17 + Math.random() * 3;

      const lng = 77 + Math.random() * 3;

      const price = Math.floor(Math.random() * 10000000);

      const categoryId = Math.floor(Math.random() * 5) + 1;

      placeholders.push(
        "(?,?,?,?,?,?,?,ST_GeomFromText(?))"
      );

      values.push(
        "Property",
        "sell",
        price,
        lat,
        lng,
        "Hyderabad",
        categoryId,
        `POINT(${lng} ${lat})`
      );
    }

    const sql = `
      INSERT INTO properties
      (
        title,
        listingType,
        price,
        lat,
        lng,
        locationText,
        categoryId,
        location
      )
      VALUES ${placeholders.join(",")}
    `;

    await pool.query(sql, values);

    console.log(`Inserted ${i + batchSize}`);
  }

  console.log("DONE");

  process.exit();
}

seed();