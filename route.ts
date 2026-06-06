import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const result = await pool.query(
      'SELECT * FROM tasks WHERE session_id = $1 ORDER BY position ASC',
      [sessionId]
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('[v0] Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, sessionId } = await req.json()

    if (!title || !sessionId) {
      return NextResponse.json({ error: 'title and sessionId required' }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, session_id, position) 
       VALUES ($1, $2, $3, (SELECT COALESCE(MAX(position), -1) + 1 FROM tasks WHERE session_id = $3))
       RETURNING *`,
      [title, description || null, sessionId]
    )

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('[v0] Error adding task:', error)
    return NextResponse.json({ error: 'Failed to add task' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { taskId, sessionId, ...updates } = await req.json()

    if (!taskId || !sessionId) {
      return NextResponse.json({ error: 'taskId and sessionId required' }, { status: 400 })
    }

    const updateFields: string[] = []
    const values: any[] = []
    let paramCount = 1

    if (updates.title !== undefined) {
      updateFields.push(`title = $${paramCount}`)
      values.push(updates.title)
      paramCount++
    }
    if (updates.completed !== undefined) {
      updateFields.push(`completed = $${paramCount}`)
      values.push(updates.completed)
      paramCount++
    }
    if (updates.description !== undefined) {
      updateFields.push(`description = $${paramCount}`)
      values.push(updates.description)
      paramCount++
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = $${paramCount}`)
    values.push(new Date())
    paramCount++

    values.push(taskId)
    values.push(sessionId)

    const query = `UPDATE tasks SET ${updateFields.join(', ')}
                   WHERE id = $${paramCount} AND session_id = $${paramCount + 1} RETURNING *`

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('[v0] Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { taskId, sessionId } = await req.json()

    if (!taskId || !sessionId) {
      return NextResponse.json({ error: 'taskId and sessionId required' }, { status: 400 })
    }

    await pool.query('DELETE FROM tasks WHERE id = $1 AND session_id = $2', [taskId, sessionId])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
