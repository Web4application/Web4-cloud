import React from 'react'
import { Task } from '@hooks/useWeb4Tasks'

type CardProps = {
  task: Task
}

export const Card = ({ task }: CardProps) => {
  const color = task.status === 'success' ? 'green' : task.status === 'failed' ? 'red' : 'orange'

  return (
    <div style={{ border: `2px solid ${color}`, borderRadius: '8px', padding: '15px' }}>
      <h3>{task.type} Task</h3>
      <p>ID: {task.id}</p>
      <p>Status: <strong>{task.status}</strong></p>
      <pre>{task.log}</pre>
    </div>
  )
}
