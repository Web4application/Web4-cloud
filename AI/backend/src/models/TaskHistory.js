const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  progress: Number,
  date: { type: Date, default: Date.now },
});

const TaskHistory = mongoose.model('TaskHistory', taskHistorySchema);

module.exports = TaskHistory;
