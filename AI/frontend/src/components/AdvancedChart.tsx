import React, { useEffect, useState } from "react";
import TrendlineChart from "./TrendlineChart";
import TaskHeatmap from "./TaskHeatmap";
import { getTaskHistory } from "../services/analyticsService";

const AdvancedChart: React.FC = () => {
  const [taskHistory, setTaskHistory] = useState<any[]>([]);
  const taskId = "some-task-id";  // Use dynamic taskId as needed

  useEffect(() => {
    const fetchTaskHistory = async () => {
      try {
        const data = await getTaskHistory(taskId);
        setTaskHistory(data);
      } catch (error) {
        console.error("Error fetching task history:", error);
      }
    };
    fetchTaskHistory();
  }, [taskId]);

  return (
    <div className="p-4 bg-white rounded shadow-lg">
      <h2 className="text-lg font-bold mb-4">Advanced Task Visualizations</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium">Task Progress Trend</h3>
          <TrendlineChart data={taskHistory} />
        </div>
        <div>
          <h3 className="font-medium">Task Completion Heatmap</h3>
          <TaskHeatmap data={taskHistory} />
        </div>
      </div>
    </div>
  );
};

export default AdvancedChart;
