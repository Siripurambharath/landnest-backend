// vendorRoutes.js
const express = require("express");
const { db } = require('./server');

const router = express.Router();   
module.exports = router;

// Get all vendors
router.get('/', async (req, res) => {
    try {
        const { profession, min_experience, max_experience } = req.query;
        
        let query = `
            SELECT 
                vendor_id,
                name,
                profession,
                mobile,
                email,
                address,
                lat,
                \`long\`,
                experience,
                profile,
                description,
                user_id_id,
                created_at,
                updated_at
            FROM users_vendors 
            WHERE 1=1
        `;
        
        const params = [];
        
        if (profession) {
            query += ` AND profession = ?`;
            params.push(profession);
        }
        
        if (min_experience) {
            query += ` AND experience >= ?`;
            params.push(min_experience);
        }
        
        if (max_experience) {
            query += ` AND experience <= ?`;
            params.push(max_experience);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        const [vendors] = await db.query(query, params);
        
        res.json({
            success: true,
            vendors: vendors,
            total: vendors.length
        });
        
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single vendor by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                vendor_id,
                name,
                profession,
                mobile,
                email,
                address,
                lat,
                \`long\`,
                experience,
                profile,
                description,
                user_id_id,
                created_at,
                updated_at
            FROM users_vendors 
            WHERE vendor_id = ?
        `;
        
        const [vendors] = await db.query(query, [id]);
        
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }
        
        res.json({
            success: true,
            vendor: vendors[0]
        });
        
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Add this to your vendorRoutes.js file (after your existing routes)

// Get vendor work images
router.get('/:id/work-images', async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                id,
                vendor_id,
                image,
                uploaded_at
            FROM users_vendorworkimage 
            WHERE vendor_id = ?
            ORDER BY uploaded_at ASC
        `;
        
        const [images] = await db.query(query, [id]);
        
        // Transform image paths to full URLs if needed
        const imageUrls = images.map(img => ({
            id: img.id,
            url: img.image, // This is the path stored in DB
            uploaded_at: img.uploaded_at
        }));
        
        res.json({
            success: true,
            vendor_id: id,
            images: imageUrls,
            total: imageUrls.length
        });
        
    } catch (error) {
        console.error('Error fetching vendor work images:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get vendor by user_id
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const query = `
            SELECT 
                vendor_id,
                name,
                profession,
                mobile,
                email,
                address,
                lat,
                \`long\`,
                experience,
                profile,
                description,
                user_id_id,
                created_at,
                updated_at
            FROM users_vendors 
            WHERE user_id_id = ?
        `;
        
        const [vendors] = await db.query(query, [userId]);
        
        if (vendors.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found for this user'
            });
        }
        
        res.json({
            success: true,
            vendor: vendors[0]
        });
        
    } catch (error) {
        console.error('Error fetching vendor by user:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get vendors by profession/category
router.get('/category/:profession', async (req, res) => {
    try {
        const { profession } = req.params;
        
        const query = `
            SELECT 
                vendor_id,
                name,
                profession,
                mobile,
                email,
                address,
                lat,
                \`long\`,
                experience,
                profile,
                description,
                user_id_id,
                created_at,
                updated_at
            FROM users_vendors 
            WHERE profession = ?
            ORDER BY created_at DESC
        `;
        
        const [vendors] = await db.query(query, [profession]);
        
        res.json({
            success: true,
            vendors: vendors,
            total: vendors.length
        });
        
    } catch (error) {
        console.error('Error fetching vendors by category:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;