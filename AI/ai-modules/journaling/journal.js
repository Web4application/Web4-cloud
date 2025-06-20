const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function journal(entry) {
  try {
    const response = await openai.createCompletion({
      model: "gpt-4",
      prompt: `Summarize the following project update entry:\n\n${entry}`,
      max_tokens: 100,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error processing journal entry:", error.message);
    throw new Error("AI Journaling Failed");
  }
}

module.exports = journal;
