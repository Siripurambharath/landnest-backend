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

module.exports = router;