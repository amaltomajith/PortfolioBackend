const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: '*', // Allow all origins during testing
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received request:', req.body); // Log incoming request
        
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
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