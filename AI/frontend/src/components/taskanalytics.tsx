import React, { useState, useEffect } from "react";
import { getTaskInsights } from "../services/analyticsService";
import Chart from "./Chart";

const TaskAnalytics: React.FC = () => {
  const [insights, setInsights] = useState<any>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await getTaskInsights();
        setInsights(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };
    fetchInsights();
  }, []);

  if (!insights) return <p>Loading analytics...</p>;

  return (
    <div className="p-4 bg-gray-100 rounded shadow-lg">
      <h2 className="text-xl font-bold mb-4">Task Analytics</h2>
      <p>Total Tasks: {insights.totalTasks}</p>
      <p>Completed: {insights.completedTasks}</p>
      <p>Pending: {insights.pendingTasks}</p>
      <p>In Progress: {insights.inProgressTasks}</p>
      <p>Completion Rate: {insights.completionRate.toFixed(2)}%</p>

      <Chart
        labels={["Completed", "Pending", "In Progress"]}
        data={[
          insights.completedTasks,
          insights.pendingTasks,
          insights.inProgressTasks,
        ]}
      />
    </div>
  );
};

export default TaskAnalytics;
