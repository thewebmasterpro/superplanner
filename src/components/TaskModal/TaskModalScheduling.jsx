import { ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReminderPicker } from '../pickers/ReminderPicker'

/**
 * TaskModalScheduling - Handles planning fields
 * Status, priority, dates, duration, reminders, meeting fields
 */
export function TaskModalScheduling({
  formData,
  setFormData,
  assignmentMode,
  isEditing
}) {
  const isMeeting = formData.type === 'meeting'
  const hideStatus = assignmentMode === 'team' && !isEditing

  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
        Planification
      </summary>
      <div className="pb-4 space-y-4">
        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-4">
          {!hideStatus && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'todo'}
                onValueChange={(value) => {
                  // Clear blocked_reason when status changes away from 'blocked'
                  const updates = { status: value }
                  if (value !== 'blocked' && formData.blocked_reason) {
                    updates.blocked_reason = ''
                  }
                  setFormData({ ...formData, ...updates })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  {formData.status === 'unassigned' && (
                    <SelectItem value="unassigned">Unassigned (Pool)</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blocked Reason */}
        {formData.status === 'blocked' && (
          <div className="space-y-2">
            <Label htmlFor="blocked_reason">Blocked Reason</Label>
            <Input
              id="blocked_reason"
              value={formData.blocked_reason}
              onChange={(e) => setFormData({ ...formData, blocked_reason: e.target.value })}
              placeholder="Why is this task blocked?"
            />
          </div>
        )}

        {/* Due Date & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (min)</Label>
            <Input
              id="duration"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
              min="5"
              step="5"
            />
          </div>
        </div>

        {/* Scheduled Time */}
        <div className="space-y-2">
          <Label htmlFor="scheduled_time">Scheduled Time</Label>
          <Input
            id="scheduled_time"
            type="datetime-local"
            value={formData.scheduled_time}
            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
          />
        </div>

        {/* Reminder */}
        <ReminderPicker
          value={formData.reminder_minutes}
          onChange={(value) => setFormData({ ...formData, reminder_minutes: value })}
        />

        {/* Meeting-specific fields */}
        {isMeeting && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Meeting location or address..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meeting_link">Meeting Link</Label>
              <Input
                id="meeting_link"
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          </>
        )}
      </div>
    </details>
  )
}
