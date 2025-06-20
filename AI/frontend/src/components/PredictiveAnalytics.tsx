import React, { useEffect, useState } from "react";
import { getTaskForecasts } from "../services/analyticsService";
import Chart from "./TaskForecastChart";

const PredictiveAnalytics: React.FC = () => {
  const [forecasts, setForecasts] = useState<any[]>([]);

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        const data = await getTaskForecasts();
        setForecasts(data);
      } catch (error) {
        console.error("Error fetching forecasts:", error);
      }
    };

    fetchForecasts();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow-lg">
      <h2 className="text-lg font-bold mb-2">Predictive Analytics</h2>
      <Chart data={forecasts} />
    </div>
  );
};

export default PredictiveAnalytics;
