const { Configuration, OpenAIApi } = require("openai");

const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

async function analyzeTask(taskDescription) {
  try {
    const response = await openai.createCompletion({
      model: "gpt-4",
      prompt: `Analyze the complexity and suggest possible improvements for the following task: ${taskDescription}`,
      max_tokens: 150,
    });
    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error("Error analyzing task:", error.message);
    throw new Error("AI Analysis Failed");
  }
}

module.exports = analyzeTask;

<div style="background-color: #2f3136; padding: 20px; border-radius: 10px; color: #dcddde; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <h1 style="color: #ffffff;">AI Text Analysis</h1>
  <p>Enter your message and let the AI decode the vibes.</p>

  <form id="analyze-form">
    <textarea id="text" placeholder="Type something insightful..." 
              style="width: 100%; height: 150px; padding: 12px; background-color: #40444b; border: none; border-radius: 8px; color: #dcddde; font-size: 14px;"></textarea><br>
    <button type="submit" 
            style="margin-top: 10px; padding: 10px 20px; background-color: #5865f2; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
      Analyze
    </button>
  </form>

  <div id="result" style="display:none; margin-top: 20px; background-color: #36393f; padding: 15px; border-radius: 8px;">
    <h2 style="color: #ffffff;">Analysis Result:</h2>
    <p id="analysis" style="color: #dcddde;"></p>
  </div>
</div>

<script>
  document.getElementById('analyze-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = document.getElementById('text').value.trim();
    if (!text) {
      alert('Please enter some text.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (response.ok) {
        document.getElementById('result').style.display = 'block';
        document.getElementById('analysis').textContent = data.analysis;
      } else {
        alert('AI failed to analyze your text. Try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Something went wrong with the server.');
    }
  });
</script>
