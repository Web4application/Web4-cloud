import React from 'react'
import { useWeb4Tasks } from '@hooks/useWeb4Tasks'
import { Card } from './Card'

export const Dashboard = () => {
  const { tasks } = useWeb4Tasks()

  return (
    <div style={{ padding: '20px' }}>
      <h1>Web4 Real-time Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
        {tasks.map(task => (
          <Card key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
