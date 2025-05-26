const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://amaltomajith.github.io/PortfolioFrontent', 'http://localhost:3000'], // Updated GitHub Pages domain
    methods: ['POST'],
    credentials: true
}));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        // Generate response
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        
        res.json({ response: text });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Failed to process the request' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 