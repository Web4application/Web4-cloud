import React, { useState, useEffect } from "react";
import { interactWithLola } from "../services/api";
import { getTasks } from "../services/taskService";

const AIInsights: React.FC = () => {
  const [lolaMessage, setLolaMessage] = useState("");
  const [response, setResponse] = useState("");
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await getTasks({});
        setTasks(data);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();
  }, []);

  const handleLolaInteraction = async () => {
    try {
      const reply = await interactWithLola(lolaMessage);
      setResponse(reply);
    } catch (error) {
      console.error("Error interacting with Lola:", error);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Lola Insights</h2>

      <textarea
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        placeholder="Ask Lola for project insights..."
        value={lolaMessage}
        onChange={(e) => setLolaMessage(e.target.value)}
      />

      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleLolaInteraction}>
        Ask Lola
      </button>

      {response && <p className="mt-4 bg-white p-2 rounded shadow">{response}</p>}

      <h3 className="mt-4 text-lg font-bold">Task Recommendations:</h3>
      {tasks.map((task) => (
        <div key={task._id} className="bg-white p-2 mb-2 rounded shadow">
          <h4>{task.title}</h4>
          <p>{task.analysis || "No AI insights available."}</p>
        </div>
      ))}
    </div>
  );
};

export default AIInsights;
