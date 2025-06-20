const Task = require("../models/Task");

// Get filtered, sorted tasks
exports.getTasks = async (req, res) => {
  const { status, priority, sortBy, order } = req.query;
  let filter = {};

  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const sortOrder = order === "desc" ? -1 : 1;
  const sortField = sortBy ? sortBy : "createdAt";

  try {
    const tasks = await Task.find(filter).sort({ [sortField]: sortOrder });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update task priority
exports.updatePriority = async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body;

  try {
    const task = await Task.findByIdAndUpdate(id, { priority }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFilteredTasks = async (req, res) => {
  const { status, priority, sortBy } = req.query;
  let filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  try {
    const tasks = await Task.find(filter).sort({ [sortBy]: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const analyzeTask = require("../../ai-modules/task-analysis/analyzeTask");

exports.analyzeTaskById = async (req, res) => {
  const { id } = req.params;

  try {
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const analysis = await analyzeTask(task.title);
    task.analysis = analysis;
    await task.save();

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const TaskHistory = require('../models/TaskHistory');
const Task = require('../models/Task');

exports.updateTaskProgress = async (taskId, progress) => {
  try {
    const task = await Task.findById(taskId);
    if (task) {
      task.progress = progress;
      await task.save();

      const history = new TaskHistory({ taskId, progress });
      await history.save();
    }
  } catch (error) {
    console.error('Error updating task progress:', error);
  }
};
