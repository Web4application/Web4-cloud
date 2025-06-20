const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function reviewCode(codeSnippet) {
  try {
    const response = await openai.createCompletion({
      model: "gpt-4",
      prompt: `Review the following code and suggest improvements:\n\n${codeSnippet}`,
      max_tokens: 200,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error reviewing code:", error.message);
    throw new Error("AI Code Review Failed");
  }
}

module.exports = reviewCode;
