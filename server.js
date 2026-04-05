const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { User, RawMaterial, Product, ProductionLog, Transaction, produceProduct } = require('./models');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/workshop';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('Connection error:', err));

// --- API Endpoints ---

// Get Stats
app.get('/api/stats', async (req, res) => {
    try {
        const materials = await RawMaterial.find();
        const products = await Product.find();
        const workers = await User.find({ role: 'worker' });
        const logs = await ProductionLog.find().populate('worker product').sort({ date: -1 }).limit(10);
        
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

// Update Stock
app.post('/api/materials', async (req, res) => {
    try {
        const material = new RawMaterial(req.body);
        await material.save();
        res.json(material);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get Workers
app.get('/api/workers', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Alias for workers
app.get('/api/users', async (req, res) => {
    try {
        const workers = await User.find({ role: 'worker' });
        res.json(workers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
