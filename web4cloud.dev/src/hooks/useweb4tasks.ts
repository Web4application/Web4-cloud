import { useState, useEffect } from 'react'
import { fetchTasks } from '@services/api'

export type Task = {
  id: string
  type: 'AI' | 'Blockchain' | 'IPFS'
  status: 'pending' | 'success' | 'failed'
  log: string
}

export const useWeb4Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])

  const updateTasks = async () => {
    try {
      const data = await fetchTasks()
      setTasks(data)
    } catch (err) {
      console.error('Failed to fetch tasks', err)
    }
  }

  useEffect(() => {
    updateTasks()
    const interval = setInterval(updateTasks, 10000) // Auto-refresh every 10s
    return () => clearInterval(interval)
  }, [])

  return { tasks, updateTasks }
}
