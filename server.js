require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI with DeepSeek configuration
const openai = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: process.env.DEEPSEEK_API_KEY
});

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
    const apiKeyStatus = process.env.DEEPSEEK_API_KEY ? 
        `configured (length: ${process.env.DEEPSEEK_API_KEY.length})` : 
        'missing';
    
    res.json({ 
        status: 'ok', 
        message: 'Server is running',
        config: {
            apiKey: apiKeyStatus,
            nodeEnv: process.env.NODE_ENV || 'not set',
            model: 'deepseek-chat'
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
        if (!process.env.DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY is not configured');
            return res.status(500).json({ 
                error: 'API key not configured',
                details: 'The DeepSeek API key is missing from environment variables'
            });
        }

        // Log API key length and configuration
        console.log('API key length:', process.env.DEEPSEEK_API_KEY.length);
        console.log('OpenAI configuration:', {
            baseURL: openai.baseURL,
            defaultHeaders: openai.defaultHeaders,
            defaultQuery: openai.defaultQuery
        });
        console.log('Making request to DeepSeek API...');

        try {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: message }
                ],
                model: "deepseek-chat",
                temperature: 0.7,
                max_tokens: 2000
            });

            console.log('DeepSeek API response received:', completion);
            
            if (!completion.choices || !completion.choices[0]?.message?.content) {
                console.error('Unexpected response format:', completion);
                return res.status(500).json({
                    error: 'Unexpected response format',
                    details: 'The API response did not contain the expected data structure',
                    received: completion
                });
            }

            const generatedText = completion.choices[0].message.content;
            console.log('Generated response:', generatedText);
            
            res.json({ response: generatedText });
        } catch (apiError) {
            console.error('DeepSeek API Error:', {
                message: apiError.message,
                type: apiError.type,
                code: apiError.code,
                stack: apiError.stack,
                response: apiError.response?.data
            });
            
            return res.status(500).json({
                error: 'DeepSeek API Error',
                details: apiError.message,
                type: apiError.type,
                code: apiError.code,
                response: apiError.response?.data
            });
        }
    } catch (error) {
        console.error('Detailed error:', {
            message: error.message,
            type: error.name,
            code: error.code,
            stack: error.stack
        });
        res.status(500).json({ 
            error: 'Failed to process the request',
            details: error.message,
            type: error.name,
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
    console.log('- API key configured:', !!process.env.DEEPSEEK_API_KEY);
    if (process.env.DEEPSEEK_API_KEY) {
        console.log('- API key length:', process.env.DEEPSEEK_API_KEY.length);
    }
}); 