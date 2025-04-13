require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post('/api/check-grammar', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const prompt = `
      Analyze this sentence for grammatical errors and provide:
      1. Incorrect parts (highlighted).
      2. Corrected versions.
      3. Explanation for each error.
      
      Return in JSON format like this:
      {
        "original": "original sentence",
        "corrections": [
          {
            "incorrect": "wrong part",
            "correct": "fixed part",
            "explanation": "why it's wrong"
          }
        ],
        "correctedText": "fully corrected sentence"
      }

      Sentence: "${text}"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a grammar expert. Return valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: "Failed to check grammar" });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));
