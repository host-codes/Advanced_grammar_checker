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
      return res.status(400).json({ error: 'Please enter some text to check' });
    }

    const prompt = `Please analyze this text for grammar mistakes. For each error:
    1. Show the incorrect part
    2. Explain what's wrong
    3. Give the correct version
    4. Explain the grammar rule
    
    Return as JSON like this:
    {
      "errors": [
        {
          "incorrect": "wrong text",
          "explanation": "what's wrong",
          "correct": "fixed text",
          "rule": "grammar rule"
        }
      ],
      "correctParts": [
        "parts that are correct"
      ]
    }
    
    Text to analyze: "${text}"`;

    // Try GPT-4 first, then fall back to GPT-3.5
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an English grammar expert." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
    } catch (error) {
      console.log("Trying GPT-3.5 instead");
      response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an English grammar expert." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
    }

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Failed to check grammar',
      details: error.message 
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
