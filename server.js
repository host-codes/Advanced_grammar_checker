require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Grammar check endpoint
app.post('/api/check-grammar', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const prompt = `
    Analyze the following text for grammatical errors. For each error found:
    1. Identify the incorrect part
    2. Explain the error in detail
    3. Provide the correct version
    4. Give a brief grammar rule explanation
    
    Text: "${text}"
    
    Format your response as JSON with this structure:
    {
      "errors": [
        {
          "incorrectPart": "the incorrect phrase",
          "explanation": "detailed explanation of the error",
          "correction": "the correct version",
          "rule": "grammar rule explanation"
        }
      ],
      "correctParts": [
        "list of parts that are correct"
      ]
    }
    `;

    // Try with GPT-4 first, fall back to GPT-3.5-turbo if unavailable
    let response;
    let modelUsed = 'gpt-4';
    
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a professional English grammar expert." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
    } catch (error) {
      if (error.code === 'model_not_found') {
        console.log('GPT-4 not available, falling back to GPT-3.5-turbo');
        modelUsed = 'gpt-3.5-turbo';
        response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a professional English grammar expert." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000
        });
      } else {
        throw error;
      }
    }

    const content = response.choices[0].message.content;
    let result;
    
    try {
      result = JSON.parse(content);
      result.modelUsed = modelUsed; // Add which model was used to the response
    } catch (e) {
      result = { 
        errors: [], 
        correctParts: [], 
        message: content,
        modelUsed: modelUsed
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    
    let errorMessage = 'An error occurred while checking grammar';
    if (error.code === 'model_not_found') {
      errorMessage = 'The requested AI model is not available with your current API access.';
    } else if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid OpenAI API key. Please check your configuration.';
    } else if (error.code === 'context_length_exceeded') {
      errorMessage = 'The text is too long to process. Please try with a shorter text.';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
