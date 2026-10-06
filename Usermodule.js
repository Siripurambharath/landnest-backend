const express = require("express");
const { db } = require('./server');
const router = express.Router();   

router.get('/api/properties/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;
    
    let query = `
      SELECT * FROM property_property 
      WHERE user_id_id = ? 
        AND created_at IS NOT NULL
    `;
    
    const queryParams = [parseInt(userId)];
    
    // Add type condition if provided
    if (type) {
      query += ` AND type = ?`;
      queryParams.push(type.toLowerCase());
    }
    
    // Add sorting
    query += ` ORDER BY created_at DESC`;
    
    console.log('Executing query:', query);
    console.log('With params:', queryParams);
    
    const [properties] = await db.execute(query, queryParams);
    
    res.json({
      success: true,
      count: properties.length,
      data: properties
    });
    
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
});





router.get('/inbox/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(`
      SELECT
          cm.chatid,
          cm.message,
          cm.is_read,
          cm.created_at,
          cm.property_id,

          p.property_name,
          p.user_id AS property_owner,

          cm.other_user_id,

          u.first_name,
          u.last_name,
          u.profile

      FROM (
          SELECT
              *,
              CASE
                  WHEN user_id = ? THEN receiver
                  ELSE user_id
              END AS other_user_id
          FROM users_chatmessage
          WHERE user_id = ? OR receiver = ?
      ) cm

      JOIN property_property p
        ON cm.property_id = p.property_id

      JOIN users_user u
        ON u.user_id = cm.other_user_id

      ORDER BY cm.created_at DESC
    `, [userId, userId, userId]);

    res.json(rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong'
    });
  }
});
module.exports = router;