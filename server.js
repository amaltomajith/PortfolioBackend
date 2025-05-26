const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // We'll need this for making HTTP requests

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

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the Chatbot API',
        endpoints: {
            health: '/health',
            chat: '/api/chat (POST)'
        }
    });
});

// Add a health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received request:', req.body);
        
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not configured');
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log('Making request to Gemini API...');
        
        // Call Gemini API directly
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message
                                }
                            ]
                        }
                    ]
                })
            }
        );

        console.log('Gemini API response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API error:', errorData);
            throw new Error(errorData.error?.message || 'Failed to get response from Gemini API');
        }

        const data = await response.json();
        console.log('Gemini API response data:', data);
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error('Unexpected response format:', data);
            throw new Error('Unexpected response format from Gemini API');
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('Generated response:', generatedText);
        
        res.json({ response: generatedText });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: 'Failed to process the request',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment check:');
    console.log('- API key configured:', !!process.env.GEMINI_API_KEY);
}); 