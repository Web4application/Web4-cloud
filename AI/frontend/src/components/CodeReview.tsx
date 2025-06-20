import React, { useState } from "react";
import { reviewCode } from "../services/api";

const CodeReview: React.FC = () => {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");

  const handleReview = async () => {
    try {
      const result = await reviewCode(code);
      setReview(result);
    } catch {
      setReview("Error reviewing code.");
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Code Review</h2>
      <textarea
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        rows={3}
        placeholder="Enter code snippet..."
        value={code}
        onChange={(e) => setCode(e.target.value)}
      ></textarea>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleReview}>
        Review
      </button>
      {review && <p className="mt-4 bg-white p-2 rounded shadow">{review}</p>}
    </div>
  );
};

export default CodeReview;
