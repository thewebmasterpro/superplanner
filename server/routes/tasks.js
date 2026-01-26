import express from 'express'
import { pool } from '../config/database.js'

export const router = express.Router()

// GET all tasks
router.get('/', async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [tasks] = await connection.query('SELECT * FROM tasks ORDER BY due_date ASC')
    res.json(tasks || [])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  } finally {
    if (connection) connection.release()
  }
})

// GET task by ID
router.get('/:id', async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    const [tasks] = await connection.query('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    res.json(tasks[0] || {})
  } catch (error) {
    res.status(500).json({ error: error.message })
  } finally {
    if (connection) connection.release()
  }
})

// POST create task
router.post('/', async (req, res) => {
  let connection
  try {
    const { project_id, title, description, status, frequency, priority, due_date } = req.body

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' })
    }

    connection = await pool.getConnection()

    const [result] = await connection.query(
      'INSERT INTO tasks (project_id, title, description, status, frequency, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project_id || 1, title.trim(), description || null, status || 'todo', frequency || 'weekly', priority || 1, due_date || null]
    )

    res.status(201).json({ id: result.insertId, message: 'Task created' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  } finally {
    if (connection) connection.release()
  }
})

// PUT update task
router.put('/:id', async (req, res) => {
  let connection
  try {
    const { title, description, status, frequency, priority, due_date } = req.body

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' })
    }

    connection = await pool.getConnection()

    await connection.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, frequency = ?, priority = ?, due_date = ? WHERE id = ?',
      [title.trim(), description, status, frequency, priority, due_date, req.params.id]
    )

    res.json({ message: 'Task updated' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  } finally {
    if (connection) connection.release()
  }
})

// DELETE task
router.delete('/:id', async (req, res) => {
  let connection
  try {
    connection = await pool.getConnection()
    await connection.query('DELETE FROM tasks WHERE id = ?', [req.params.id])
    res.json({ message: 'Task deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  } finally {
    if (connection) connection.release()
  }
})
