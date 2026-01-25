import express from 'express'
import { pool } from '../config/database.js'

export const router = express.Router()

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [tasks] = await connection.query('SELECT * FROM tasks ORDER BY due_date ASC')
    await connection.release()
    res.json(tasks || [])
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
})

// GET task by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection()
    const [tasks] = await connection.query('SELECT * FROM tasks WHERE id = ?', [req.params.id])
    await connection.release()
    res.json(tasks[0] || {})
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST create task
router.post('/', async (req, res) => {
  try {
    const { project_id, title, description, status, frequency, priority, due_date } = req.body
    const connection = await pool.getConnection()
    
    const [result] = await connection.query(
      'INSERT INTO tasks (project_id, title, description, status, frequency, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [project_id || 1, title, description || null, status || 'todo', frequency || 'weekly', priority || 1, due_date || null]
    )
    
    await connection.release()
    res.status(201).json({ id: result.insertId, message: 'Task created' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, frequency, priority, due_date } = req.body
    const connection = await pool.getConnection()
    
    await connection.query(
      'UPDATE tasks SET title = ?, description = ?, status = ?, frequency = ?, priority = ?, due_date = ? WHERE id = ?',
      [title, description, status, frequency, priority, due_date, req.params.id]
    )
    
    await connection.release()
    res.json({ message: 'Task updated' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const connection = await pool.getConnection()
    await connection.query('DELETE FROM tasks WHERE id = ?', [req.params.id])
    await connection.release()
    res.json({ message: 'Task deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
