import { ChevronRight } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * TaskModalOrganisation - Handles organisation fields
 * Category, project (département), tags, campaign (projet)
 */
export function TaskModalOrganisation({
  formData,
  setFormData,
  categories,
  projects,
  tags,
  selectedTags,
  setSelectedTags,
  campaigns
}) {
  return (
    <details className="group">
      <summary className="flex items-center gap-2 cursor-pointer py-3 border-t border-base-200 text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-80 transition-opacity select-none">
        <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
        Organisation
      </summary>
      <div className="pb-4 space-y-4">
        {/* Category & Project */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Département</Label>
            <Select
              value={formData.project_id || undefined}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un département" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 rounded-xl bg-base-200/30 p-3 min-h-[2.5rem]">
            {tags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No tags available</p>
            ) : (
              tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <Badge
                    key={tag.id}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer select-none transition-all hover:scale-105 rounded-lg"
                    style={isSelected
                      ? { backgroundColor: tag.color, color: 'white' }
                      : { borderColor: tag.color, color: tag.color }
                    }
                    onClick={() => {
                      setSelectedTags(prev =>
                        isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                      )
                    }}
                  >
                    {tag.name}
                  </Badge>
                )
              })
            )}
          </div>
        </div>

        {/* Campaign (Projet) */}
        <div className="space-y-2">
          <Label htmlFor="campaign">Projet</Label>
          <Select
            value={formData.campaign_id || 'none'}
            onValueChange={(value) => setFormData({ ...formData, campaign_id: value === 'none' ? null : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {campaigns.map((camp) => (
                <SelectItem key={camp.id} value={camp.id}>{camp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </details>
  )
}
