const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function interactWithLola(message) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "system", content: "You are Lola, the project assistant." }, { role: "user", content: message }],
    });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error("Lola Interaction Error:", error.message);
    throw new Error("Lola Interaction Failed");
  }
}

module.exports = interactWithLola;
