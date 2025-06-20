import React from "react";

interface TaskCardProps {
  title: string;
  status: string;
  priority: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ title, status, priority }) => {
  return (
    <div className="bg-white shadow-md p-4 rounded-md">
      <h3 className="font-bold text-lg">{title}</h3>
      <p>Status: {status}</p>
      <p>Priority: {priority}</p>
    </div>
  );
};

export default TaskCard;
