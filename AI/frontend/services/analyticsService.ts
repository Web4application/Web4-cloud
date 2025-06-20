import axios from "axios";

const API_URL = "http://localhost:5000/api/analytics";

export const getTaskInsights = async () => {
  try {
    const response = await axios.get(`${API_URL}/task-insights`);
    return response.data;
  } catch (error) {
    console.error("Error fetching task insights:", error);
    throw error;
  }
};
