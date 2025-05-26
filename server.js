require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Startup configuration logging
console.log('Starting server with configuration:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', port);
console.log('- OPENROUTER_API_KEY configured:', !!process.env.OPENROUTER_API_KEY);
if (process.env.OPENROUTER_API_KEY) {
    console.log('- API key length:', process.env.OPENROUTER_API_KEY.length);
}

// Initialize OpenAI with OpenRouter configuration
let openai;
try {
    openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY || '', // Provide empty string as fallback
        defaultHeaders: {
            "HTTP-Referer": "https://amaltomajith.github.io",
            "X-Title": "Amal's Portfolio",
        }
    });
    console.log('OpenAI client initialized successfully');
} catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
}

// Middleware
app.use(express.json());
app.use(cors({
    origin: ['https://amaltomajith.github.io', 'http://localhost:3000', 'http://127.0.0.1:5500', 'https://amaltom.life', 'https://www.amaltom.life'],
    methods: ['POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Origin'],
    credentials: true
}));

// Basic error handling middleware
app.use((err, req, res, next) => {
    console.error('Middleware error:', err);
    next(err);
});

// Root route with error handling
app.get('/', (req, res) => {
    try {
        res.json({ 
            message: 'Welcome to the Chatbot API',
            endpoints: {
                health: '/health',
                chat: '/api/chat (POST)'
            }
        });
    } catch (error) {
        console.error('Error in root route:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Health check endpoint with detailed information
app.get('/health', (req, res) => {
    try {
        const apiKeyStatus = process.env.OPENROUTER_API_KEY ? 
            `configured (length: ${process.env.OPENROUTER_API_KEY.length})` : 
            'missing';
        
        const healthCheck = { 
            status: 'ok', 
            message: 'Server is running',
            timestamp: new Date().toISOString(),
            config: {
                apiKey: apiKeyStatus,
                nodeEnv: process.env.NODE_ENV || 'not set',
                model: 'deepseek/deepseek-chat-v3-0324:free'
            },
            openai: {
                initialized: !!openai,
                baseURL: openai?.baseURL,
                hasApiKey: !!openai?.apiKey
            }
        };

        res.json(healthCheck);
    } catch (error) {
        console.error('Error in health check:', error);
        res.status(500).json({ error: 'Health check failed', details: error.message });
    }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        console.log('Received chat request:', {
            timestamp: new Date().toISOString(),
            body: req.body,
            headers: req.headers
        });
        
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.OPENROUTER_API_KEY) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }

        console.log('Making request to OpenRouter API...');

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: message }
            ],
            model: "deepseek/deepseek-chat-v3-0324:free",
            temperature: 0.7,
            max_tokens: 2000
        });

        console.log('OpenRouter API response received');
        
        if (!completion.choices?.[0]?.message?.content) {
            throw new Error('Unexpected response format from OpenRouter API');
        }

        const generatedText = completion.choices[0].message.content;
        console.log('Generated response length:', generatedText.length);
        
        res.json({ response: generatedText });
    } catch (error) {
        console.error('Chat endpoint error:', {
            message: error.message,
            stack: error.stack,
            type: error.name,
            code: error.code
        });

        res.status(500).json({ 
            error: 'Failed to process the request',
            details: error.message,
            type: error.name,
            code: error.code
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler:', {
        message: err.message,
        stack: err.stack,
        type: err.name
    });
    
    res.status(500).json({
        error: 'Server error',
        details: err.message,
        type: err.name
    });
});

// Start server with error handling
const server = app.listen(port, () => {
    console.log(`Server started successfully on port ${port}`);
}).on('error', (error) => {
    console.error('Server startup error:', error);
    process.exit(1);
}); 