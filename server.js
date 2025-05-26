const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // We'll need this for making HTTP requests

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://amaltomajith.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500'],
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
    const apiKeyStatus = process.env.GEMINI_API_KEY ? 
        `configured (length: ${process.env.GEMINI_API_KEY.length})` : 
        'missing';
    
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        config: {
            apiKey: apiKeyStatus,
            nodeEnv: process.env.NODE_ENV || 'not set'
        }
    });
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
            return res.status(500).json({ 
                error: 'API key not configured',
                details: 'The Gemini API key is missing from environment variables'
            });
        }

        // Log API key length for debugging (never log the actual key)
        console.log('API key length:', process.env.GEMINI_API_KEY.length);
        console.log('Making request to Gemini API...');
        
        const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`;
        console.log('API URL (without key):', apiUrl.split('?')[0]);
        
        // Call Gemini API directly
        const response = await fetch(apiUrl, {
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
        });

        console.log('Gemini API response status:', response.status);
        
        const responseText = await response.text();
        console.log('Raw Gemini API response:', responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Failed to parse Gemini API response:', e);
            return res.status(500).json({
                error: 'Invalid response from Gemini API',
                details: 'Failed to parse JSON response',
                rawResponse: responseText
            });
        }

        if (!response.ok) {
            console.error('Gemini API error:', data);
            return res.status(500).json({
                error: 'Gemini API error',
                details: data.error?.message || 'Unknown error from Gemini API',
                rawError: data.error || data
            });
        }

        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            console.error('Unexpected response format:', data);
            return res.status(500).json({
                error: 'Unexpected response format',
                details: 'The API response did not contain the expected data structure',
                received: data
            });
        }

        const generatedText = data.candidates[0].content.parts[0].text;
        console.log('Generated response:', generatedText);
        
        res.json({ response: generatedText });
    } catch (error) {
        console.error('Detailed error:', error);
        res.status(500).json({ 
            error: 'Failed to process the request',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            type: error.name,
            code: error.code
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        error: 'Server error',
        details: err.message,
        type: err.name
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment check:');
    console.log('- API key configured:', !!process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY) {
        console.log('- API key length:', process.env.GEMINI_API_KEY.length);
    }
}); 