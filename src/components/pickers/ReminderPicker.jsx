import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ReminderPicker({ value, onChange, label = "Reminder" }) {
  const options = [
    { value: null, label: 'No reminder' },
    { value: 5, label: '5 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 1440, label: '1 day before' },
  ]

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select
        value={value === null || value === undefined ? 'none' : String(value)}
        onValueChange={(val) => onChange(val === 'none' ? null : parseInt(val))}
      >
        <SelectTrigger>
          <SelectValue placeholder="No reminder" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value || 'none'} value={opt.value === null ? 'none' : String(opt.value)}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
