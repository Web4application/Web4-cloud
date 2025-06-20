import axios from "axios";

const API_URL = "http://localhost:5000/api/tasks";

export const getTasks = async (filters: any) => {
  try {
    const response = await axios.get(API_URL, { params: filters });
    return response.data;
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw error;
  }
};

export const updateTaskPriority = async (id: string, priority: string) => {
  try {
    const response = await axios.put(`${API_URL}/priority/${id}`, { priority });
    return response.data;
  } catch (error) {
    console.error("Error updating priority:", error);
    throw error;
  }
};
