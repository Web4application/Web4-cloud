import React, { useState } from "react";

interface TaskFilterProps {
  onFilterChange: (filters: any) => void;
}

const TaskFilter: React.FC<TaskFilterProps> = ({ onFilterChange }) => {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("asc");

  const handleFilterChange = () => {
    onFilterChange({ status, priority, sortBy, order });
  };

  return (
    <div className="bg-gray-100 p-4 mb-4 rounded shadow">
      <h3 className="text-lg font-bold">Filter Tasks</h3>
      <div className="flex gap-4">
        <select onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <select onChange={(e) => setPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select onChange={(e) => setSortBy(e.target.value)}>
          <option value="createdAt">Created</option>
          <option value="priority">Priority</option>
        </select>

        <select onChange={(e) => setOrder(e.target.value)}>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <button onClick={handleFilterChange} className="bg-blue-500 text-white px-4 py-1 rounded">
          Apply
        </button>
      </div>
    </div>
  );
};

export default TaskFilter;
