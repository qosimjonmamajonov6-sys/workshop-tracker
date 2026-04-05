const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize, User, RawMaterial, Product, ProductionLog, Transaction, produceProduct } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection & Sync ---
sequelize.authenticate()
    .then(() => {
        console.log('PostgreSQL connected');
        return sequelize.sync(); // Create tables if they don't exist
    })
    .catch(err => console.error('Connection error:', err));

// --- API Endpoints ---

// Get Stats
app.get('/api/stats', async (req, res) => {
    try {
        const materials = await RawMaterial.findAll();
        const products = await Product.findAll();
        const workers = await User.findAll({ where: { role: 'worker' } });
        const logs = await ProductionLog.findAll({
            include: ['worker', 'product'],
            limit: 10,
            order: [['date', 'DESC']]
        });
        
        res.json({ materials, products, workers, logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create Production Log
app.post('/api/produce', async (req, res) => {
    const { productId, amount, workerId } = req.body;
    try {
        const result = await produceProduct(productId, amount, workerId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update Stock / New Material
app.post('/api/materials', async (req, res) => {
    try {
        const material = await RawMaterial.create(req.body);
        res.json(material);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get Workers
app.get('/api/workers', async (req, res) => {
    try {
        const workers = await User.findAll({ where: { role: 'worker' } });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Worker
app.post('/api/workers', async (req, res) => {
    try {
        const worker = await User.create({ ...req.body, role: 'worker' });
        res.json(worker);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get Products
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.findAll();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add Product
app.post('/api/products', async (req, res) => {
    try {
        const product = await Product.create(req.body);
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- Production & Static Files ---

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'frontend/dist')));
  app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
  });
}


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
