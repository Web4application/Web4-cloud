import React, { useEffect, useState } from "react";
import { getTasks, updateTaskPriority } from "../services/taskService";
import { analyzeTaskById } from "../services/api";
import TaskFilter from "./TaskFilter";
import AIInsights from "./AIInsights";

const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = async (filters = {}) => {
    try {
      const data = await getTasks(filters);
      setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const handleAnalyzeTask = async (id: string) => {
    try {
      await analyzeTaskById(id);
      fetchTasks();
    } catch (error) {
      console.error("Error analyzing task:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Task Dashboard</h1>
      <TaskFilter onFilterChange={fetchTasks} />
      <AIInsights />

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <div key={task._id} className="bg-gray-100 p-4 rounded shadow">
            <h3>{task.title}</h3>
            <p>Status: {task.status}</p>
            <p>Priority: {task.priority}</p>
            <button
              className="bg-blue-500 text-white px-4 py-1 rounded mt-2"
              onClick={() => handleAnalyzeTask(task._id)}
            >
              Analyze Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
