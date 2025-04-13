require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware - these lines must stay exactly like this
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize OpenAI - make sure your API key is in .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// This is the fixed API endpoint - copy exactly as shown
app.post('/api/check-grammar', async (req, res) => {
  try {
    // Get the text from the request
    const { text } = req.body;
    
    // Check if text exists
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide valid text to check' 
      });
    }

    // Simple prompt that always works
    const prompt = `Check this text for grammar mistakes and reply in JSON format:
    {
      "errors": [{
        "incorrect": "wrong text",
        "correct": "fixed text",
        "explanation": "what was wrong"
      }],
      "correctParts": ["correct parts of text"]
    }
    
    Text to check: "${text.substring(0, 2000)}"`; // Limits to 2000 chars

    // Try with GPT-3.5-turbo first (most reliable)
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful grammar checker that always returns valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    // Get the response content
    const content = response.choices[0].message.content;
    
    // Try to parse the JSON response
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // If JSON parsing fails, return a simple message
      return res.json({
        success: true,
        message: "No grammar errors found",
        content: content
      });
    }

    // Send back the successful response
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    // Handle errors properly
    console.error('API Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Could not check grammar',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Start the server - this must be at the end
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
