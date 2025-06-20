import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface ChartProps {
  labels: string[];
  data: number[];
}

const Chart: React.FC<ChartProps> = ({ labels, data }) => {
  const chartData = {
    labels,
    datasets: [
      {
        data,
        backgroundColor: ["#4CAF50", "#FF9800", "#2196F3"],
        hoverOffset: 4,
      },
    ],
  };

  return <Pie data={chartData} />;
};

export default Chart;
