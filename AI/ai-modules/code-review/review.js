const { OpenAI } = require("openai");

const openai = new OpenAI(process.env.OPENAI_API_KEY);

async function reviewCode(codeSnippet) {
  const response = await openai.createCompletion({
    model: "gpt-4",
    prompt: `Analyze the following code for potential improvements and bugs:\n\n${codeSnippet}`,
    max_tokens: 150,
  });

  return response.data.choices[0].text.trim();
}

module.exports = reviewCode;
