'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'

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

interface TaskItemProps {
  task: Task
  onUpdate: (taskId: number, updates: Partial<{ title: string; completed: boolean; description: string }>) => void
  onDelete: (taskId: number) => void
}

export function TaskItem({ task, onUpdate, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || '')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    if (title.trim()) {
      onUpdate(task.id, { title, description })
      setIsEditing(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setTitle(task.title)
      setDescription(task.description || '')
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg border border-border">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="flex-1 bg-transparent text-foreground outline-none font-medium"
        />
        <button
          onClick={handleSave}
          className="px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm"
        >
          Save
        </button>
        <button
          onClick={() => {
            setIsEditing(false)
            setTitle(task.title)
            setDescription(task.description || '')
          }}
          className="px-2 py-1 bg-border text-foreground rounded hover:bg-border/80 text-sm"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-background-secondary rounded-lg border border-border hover:border-primary/50 transition-colors">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(e) => onUpdate(task.id, { completed: e.target.checked })}
        className="mt-1 w-5 h-5 cursor-pointer accent-primary rounded"
      />
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsEditing(true)}>
        <p className={`font-medium break-words ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 break-words">{task.description}</p>
        )}
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="text-muted-foreground hover:text-destructive transition-colors p-1"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

interface TaskListProps {
  tasks: Task[]
  onUpdate: (taskId: number, updates: Partial<{ title: string; completed: boolean; description: string }>) => void
  onDelete: (taskId: number) => void
  onAddTask: (title: string, description: string) => void
  isConnected: boolean
}

export function TaskList({ tasks, onUpdate, onDelete, onAddTask, isConnected }: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDescription, setNewTaskDescription] = useState('')

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle, newTaskDescription)
      setNewTaskTitle('')
      setNewTaskDescription('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleAddTask()
    }
  }

  const completedCount = tasks.filter((t) => t.completed).length

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-foreground">Live To-Do List</h1>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        {tasks.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {completedCount} of {tasks.length} tasks completed
          </p>
        )}
      </div>

      <div className="space-y-3 mb-6">
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No tasks yet. Add one to get started!</p>
        ) : (
          tasks.map((task) => (
            <TaskItem key={task.id} task={task} onUpdate={onUpdate} onDelete={onDelete} />
          ))
        )}
      </div>

      <div className="bg-background-secondary rounded-lg border border-border p-4 space-y-3">
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="What needs to be done?"
          className="w-full bg-background text-foreground placeholder-muted-foreground rounded border border-border px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        <textarea
          value={newTaskDescription}
          onChange={(e) => setNewTaskDescription(e.target.value)}
          placeholder="Add details (optional)"
          className="w-full bg-background text-foreground placeholder-muted-foreground rounded border border-border px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          rows={2}
        />
        <button
          onClick={handleAddTask}
          disabled={!newTaskTitle.trim() || !isConnected}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>
    </div>
  )
}
