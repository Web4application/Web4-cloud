const Task = require("../models/Task");

exports.calculateCompletionProbability = async () => {
  try {
    const tasks = await Task.find({});
    const now = new Date();

    const predictions = tasks.map(task => {
      const dueDate = new Date(task.dueDate);
      const timeRemaining = (dueDate - now) / (1000 * 60 * 60 * 24); // Days remaining
      let probability = 0;

      if (task.status === "completed") {
        probability = 100;
      } else if (timeRemaining <= 0) {
        probability = 0;
      } else {
        const progress = task.progress || 0;
        probability = Math.min(100, progress + timeRemaining * 10);
      }

      task.completionProbability = probability;
      return task.save();
    });

    await Promise.all(predictions);
  } catch (error) {
    console.error("Error calculating completion probability:", error);
  }
};

exports.getTaskForecasts = async (req, res) => {
  try {
    const tasks = await Task.find({}).select("title completionProbability dueDate");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const { io } = require("../server");

exports.notifyTaskUpdates = async () => {
  const tasks = await Task.find({}).select("title status completionProbability");
  io.emit("taskUpdates", tasks);
};

const TaskHistory = require('../models/TaskHistory');

exports.getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.query;
    const history = await TaskHistory.find({ taskId }).sort({ date: 1 });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
