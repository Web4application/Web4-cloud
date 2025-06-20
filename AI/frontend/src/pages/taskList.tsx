import React, { useEffect, useState } from "react";
import axios from "axios";
import TaskCard from "../components/TaskCard";

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/tasks")
      .then((res) => setTasks(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Task List</h1>
      {tasks.map((task) => (
        <TaskCard key={task._id} title={task.title} status={task.status} priority={task.priority} />
      ))}
    </div>
  );
};

export default TaskList;
