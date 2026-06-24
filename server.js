const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.log('❌ MongoDB error:', err));

// ─── Snippet Schema ──────────────────────────────────────────────────────────
const snippetSchema = new mongoose.Schema({
    title: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    description: { type: String },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Snippet = mongoose.model('Snippet', snippetSchema);

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET all snippets
app.get('/api/snippets', async (req, res) => {
    try {
        const snippets = await Snippet.find().sort({ createdAt: -1 });
        res.json(snippets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET snippet by ID
app.get('/api/snippets/:id', async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);
        if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
        res.json(snippet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE new snippet
app.post('/api/snippets', async (req, res) => {
    try {
        const { title, language, code, description, tags } = req.body;

        if (!title || !language || !code) {
            return res.status(400).json({ error: 'Title, language, and code are required' });
        }

        const snippet = new Snippet({
            title,
            language,
            code,
            description: description || '',
            tags: tags || []
        });

        const saved = await snippet.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE snippet
app.put('/api/snippets/:id', async (req, res) => {
    try {
        const { title, language, code, description, tags } = req.body;

        const snippet = await Snippet.findByIdAndUpdate(
            req.params.id,
            {
                title,
                language,
                code,
                description,
                tags,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
        res.json(snippet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE snippet
app.delete('/api/snippets/:id', async (req, res) => {
    try {
        const snippet = await Snippet.findByIdAndDelete(req.params.id);
        if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
        res.json({ message: 'Snippet deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// SEARCH snippets by tag or language
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const snippets = await Snippet.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { language: { $regex: q, $options: 'i' } },
                { tags: { $regex: q, $options: 'i' } },
                { description: { $regex: q, $options: 'i' } }
            ]
        });
        res.json(snippets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running ✅' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});