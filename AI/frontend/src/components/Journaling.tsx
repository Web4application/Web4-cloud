import React, { useState } from "react";
import { journalEntry } from "../services/api";

const Journaling: React.FC = () => {
  const [entry, setEntry] = useState("");
  const [summary, setSummary] = useState("");

  const handleJournal = async () => {
    try {
      const result = await journalEntry(entry);
      setSummary(result);
    } catch {
      setSummary("Error processing journal entry.");
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-lg mb-4">
      <h2 className="text-xl font-bold mb-2">Journaling</h2>
      <textarea
        className="w-full p-2 mb-2 border border-gray-300 rounded"
        rows={3}
        placeholder="Write your daily update..."
        value={entry}
        onChange={(e) => setEntry(e.target.value)}
      ></textarea>
      <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleJournal}>
        Submit
      </button>
      {summary && <p className="mt-4 bg-white p-2 rounded shadow">{summary}</p>}
    </div>
  );
};

export default Journaling;
