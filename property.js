const express = require("express");

const cors = require("cors");

const pool = require("./db2");

const app = express();

app.use(cors());

app.get("/properties", async (req, res) => {

  try {

    const {
      north,
      south,
      east,
      west,
      categoryId,
      minPrice,
      maxPrice
    } = req.query;

    let sql = `
      SELECT
        p.id,
        p.price,
        p.lat,
        p.lng,
        c.name as categoryName

      FROM properties p

      LEFT JOIN property_categories c
      ON c.id = p.categoryId

      WHERE
        p.lat BETWEEN ? AND ?
      AND
        p.lng BETWEEN ? AND ?
    `;

    const params = [
      south,
      north,
      west,
      east
    ];

    if (categoryId) {

      sql += ` AND p.categoryId = ? `;

      params.push(categoryId);
    }

    if (minPrice) {

      sql += ` AND p.price >= ? `;

      params.push(minPrice);
    }

    if (maxPrice) {

      sql += ` AND p.price <= ? `;

      params.push(maxPrice);
    }

    sql += ` LIMIT 5000 `;

    const [rows] = await pool.query(
      sql,
      params
    );

    res.json(rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

app.get("/search", async (req, res) => {

  try {

    const { q } = req.query;

    if (!q) {

      return res.json([]);
    }

    const [rows] = await pool.query(
      `
      SELECT
        id,
        title,
        price,
        lat,
        lng,
        locationText

      FROM properties

      WHERE MATCH(locationText)
      AGAINST(? IN NATURAL LANGUAGE MODE)

      LIMIT 20
      `,
      [q]
    );

    res.json(rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

app.get("/categories", async (req, res) => {

  try {

    const [rows] = await pool.query(`
      SELECT
        id,
        name
      FROM property_categories
    `);

    res.json(rows);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: "Server Error"
    });
  }
});

app.listen(5000, () => {
  console.log("Server Running");
});