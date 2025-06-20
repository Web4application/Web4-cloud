import React from "react";
import { HeatMap } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, HeatMapElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, HeatMapElement, Title, Tooltip, Legend);

interface HeatmapProps {
  data: { date: string; progress: number }[];
}

const TaskHeatmap: React.FC<HeatmapProps> = ({ data }) => {
  const dates = [...new Set(data.map((item) => new Date(item.date).toLocaleDateString()))];
  const progressData = dates.map((date) => {
    return data.filter((item) => new Date(item.date).toLocaleDateString() === date).map((item) => item.progress);
  });

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "Task Progress Heatmap",
        data: progressData,
        backgroundColor: "rgba(33, 150, 243, 0.2)",
      },
    ],
  };

  return <HeatMap data={chartData} />;
};

export default TaskHeatmap;
