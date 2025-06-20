import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const analyzeTask = async (taskDescription: string) => {
  try {
    const response = await axios.post(`${API_URL}/analyze-task`, { taskDescription });
    return response.data.analysis;
  } catch (error) {
    console.error("Error in Task Analysis:", error);
    throw error;
  }
};

export const reviewCode = async (codeSnippet: string) => {
  try {
    const response = await axios.post(`${API_URL}/review-code`, { codeSnippet });
    return response.data.review;
  } catch (error) {
    console.error("Error in Code Review:", error);
    throw error;
  }
};

export const journalEntry = async (entry: string) => {
  try {
    const response = await axios.post(`${API_URL}/journal`, { entry });
    return response.data.summary;
  } catch (error) {
    console.error("Error in Journaling:", error);
    throw error;
  }
};

export const interactWithLola = async (message: string) => {
  try {
    const response = await axios.post(`${API_URL}/lola`, { message });
    return response.data.reply;
  } catch (error) {
    console.error("Error in Lola Interaction:", error);
    throw error;
  }
};
