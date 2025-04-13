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

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a professional English grammar expert." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    let result;
    
    try {
      result = JSON.parse(content);
    } catch (e) {
      result = { errors: [], correctParts: [], message: content };
    }

    res.json(result);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while checking grammar' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});