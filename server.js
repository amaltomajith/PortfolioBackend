const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://amaltomajith.github.io', 'http://localhost:3000'], // Allow GitHub Pages and local development
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received request:', req.body); // Log incoming request
        
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Initialize the model
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        console.log('Generating response for:', message); // Log before generating
        
        // Generate response
        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();
        
        console.log('Generated response:', text); // Log response
        
        res.json({ response: text });
    } catch (error) {
        console.error('Detailed error:', error);
        if (error.message?.includes('API key')) {
            res.status(500).json({ error: 'API key configuration error' });
        } else {
            res.status(500).json({ 
                error: 'Failed to process the request',
                details: error.message
            });
        }
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 