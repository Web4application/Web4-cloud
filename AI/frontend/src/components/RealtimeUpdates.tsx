import React, { useEffect, useState } from "react";
import { subscribeToTaskUpdates, disconnectSocket } from "../services/websocketService";

const RealtimeUpdates: React.FC = () => {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    subscribeToTaskUpdates((updatedTasks) => {
      setTasks(updatedTasks);
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="bg-gray-100 p-4 rounded shadow-lg mb-4">
      <h2 className="text-lg font-bold">Real-Time Task Updates</h2>
      {tasks.length > 0 ? (
        tasks.map((task) => (
          <div key={task._id} className="mb-2">
            <strong>{task.title}:</strong> {task.status} (Probability: {task.completionProbability}%)
          </div>
        ))
      ) : (
        <p>No updates available</p>
      )}
    </div>
  );
};

export default RealtimeUpdates;
