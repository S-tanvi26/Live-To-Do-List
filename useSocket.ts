'use client'

import { useEffect, useRef, useCallback, useState } from 'react'

interface Task {
  id: number
  title: string
  description: string | null
  completed: boolean
  session_id: string
  created_at: string
  updated_at: string
  position: number
}

export function useSocket(sessionId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchRef = useRef<number>(0)

  // Fetch tasks from the server
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/tasks?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.sort((a: Task, b: Task) => a.position - b.position))
      }
    } catch (error) {
      console.error('[v0] Error fetching tasks:', error)
    }
  }, [sessionId])

  useEffect(() => {
    if (!sessionId) return

    setIsConnected(true)
    // Fetch tasks immediately
    fetchTasks()

    // Set up polling every 1 second
    pollIntervalRef.current = setInterval(() => {
      fetchTasks()
    }, 1000)

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [sessionId, fetchTasks])

  const addTask = useCallback(
    async (title: string, description: string = '') => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, sessionId }),
        })
        if (response.ok) {
          const newTask = await response.json()
          setTasks((prev) => [...prev, newTask].sort((a, b) => a.position - b.position))
        }
      } catch (error) {
        console.error('[v0] Error adding task:', error)
      }
    },
    [sessionId]
  )

  const updateTask = useCallback(
    async (taskId: number, updates: Partial<{ title: string; completed: boolean; description: string }>) => {
      try {
        const response = await fetch('/api/tasks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, sessionId, ...updates }),
        })
        if (response.ok) {
          const updatedTask = await response.json()
          setTasks((prev) =>
            prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
          )
        }
      } catch (error) {
        console.error('[v0] Error updating task:', error)
      }
    },
    [sessionId]
  )

  const deleteTask = useCallback(
    async (taskId: number) => {
      try {
        await fetch('/api/tasks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, sessionId }),
        })
        setTasks((prev) => prev.filter((task) => task.id !== taskId))
      } catch (error) {
        console.error('[v0] Error deleting task:', error)
      }
    },
    [sessionId]
  )

  const reorderTasks = useCallback(
    async (newTasks: Task[]) => {
      try {
        const reordered = newTasks.map((task, index) => ({
          id: task.id,
          position: index,
        }))
        await fetch('/api/tasks/reorder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, tasks: reordered }),
        })
        setTasks(newTasks)
      } catch (error) {
        console.error('[v0] Error reordering tasks:', error)
      }
    },
    [sessionId]
  )

  return { tasks, isConnected, addTask, updateTask, deleteTask, reorderTasks }
}
