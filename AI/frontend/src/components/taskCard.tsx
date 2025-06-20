import React from "react";

interface TaskCardProps {
  title: string;
  status: string;
  priority: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, status, priority }) => {
  return (
    <div className="bg-gray-100 p-4 rounded shadow-md mb-2">
      <h3 className="font-bold">{title}</h3>
      <p>Status: {status}</p>
      <p>Priority: {priority}</p>
    </div>
  );
};

export default TaskCard;
