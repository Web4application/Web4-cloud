import React, { useState } from "react";
import { interactWithLola } from "../services/api";

const AIInteraction: React.FC = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const handleInteraction = async () => {
    try {
      const reply = await interactWithLola(input);
      setResponse(reply);
    } catch (error) {
      setResponse("Error interacting with Lola.");
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">Talk to Lola</h2>
      <textarea
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        rows={3}
        placeholder="Ask Lola anything..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      ></textarea>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleInteraction}>
        Send
      </button>
      {response && <p className="mt-4 bg-white p-2 rounded shadow">{response}</p>}
    </div>
  );
};

export default AIInteraction;
