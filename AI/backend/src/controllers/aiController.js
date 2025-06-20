const analyzeTask = require("../../ai-modules/task-analysis/analyzeTask");

exports.analyzeTask = async (req, res) => {
  const { taskDescription } = req.body;
  try {
    const analysis = await analyzeTask(taskDescription);
    res.json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const reviewCode = require("../../ai-modules/code-review/reviewCode");

exports.reviewCode = async (req, res) => {
  const { codeSnippet } = req.body;
  try {
    const review = await reviewCode(codeSnippet);
    res.json({ review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
