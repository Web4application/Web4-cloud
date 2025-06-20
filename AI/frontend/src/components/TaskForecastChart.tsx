import React from "react";
import { Bar } from "react-chartjs-2";

interface TaskData {
  title: string;
  completionProbability: number;
}

interface ChartProps {
  data: TaskData[];
}

const TaskForecastChart: React.FC<ChartProps> = ({ data }) => {
  const labels = data.map(task => task.title);
  const probabilities = data.map(task => task.completionProbability);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Completion Probability (%)",
        data: probabilities,
        backgroundColor: "#4CAF50",
      },
    ],
  };

  return <Bar data={chartData} />;
};

export default TaskForecastChart;
