import React from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TrendlineChartProps {
  data: { date: string; progress: number }[];
}

const TrendlineChart: React.FC<TrendlineChartProps> = ({ data }) => {
  const chartData = {
    labels: data.map((item) => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: "Task Progress (%)",
        data: data.map((item) => item.progress),
        borderColor: "#2196F3",
        backgroundColor: "rgba(33, 150, 243, 0.2)",
        fill: true,
      },
    ],
  };

  return <Line data={chartData} />;
};

export default TrendlineChart;
