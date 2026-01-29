import { useState, useEffect } from 'react'
import pb from '../lib/pocketbase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, LayoutGrid } from 'lucide-react'
import toast from 'react-hot-toast'

export function CategoryManager() {
    const [categories, setCategories] = useState([])
    const [newCategory, setNewCategory] = useState({ name: '', color: '#3b82f6' })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadCategories()
    }, [])

    const loadCategories = async () => {
        try {
            const records = await pb.collection('task_categories').getFullList({
                sort: 'name'
            })
            setCategories(records || [])
        } catch (error) {
            console.error('Error loading categories:', error)
        }
    }

    const handleAddCategory = async (e) => {
        e.preventDefault()
        if (!newCategory.name.trim()) return

        setLoading(true)
        try {
            const user = pb.authStore.model

            await pb.collection('task_categories').create({
                name: newCategory.name,
                color: newCategory.color,
                user_id: user.id
            })

            toast.success('Category added successfully!')
            setNewCategory({ name: '', color: '#3b82f6' })
            loadCategories()
        } catch (error) {
            toast.error(`Failed to add category: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Delete this category? Tasks using it will remain unaffected.')) return

        try {
            await pb.collection('task_categories').delete(id)

            toast.success('Category deleted successfully!')
            loadCategories()
        } catch (error) {
            toast.error(`Failed to delete category: ${error.message}`)
        }
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                        Add New Category
                    </CardTitle>
                    <CardDescription>Create a new task category to organize your priorities</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label htmlFor="categoryName">Category Name</Label>
                                <Input
                                    id="categoryName"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                    placeholder="e.g., Development, Marketing, Personal"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="categoryColor">Color</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="categoryColor"
                                        type="color"
                                        value={newCategory.color}
                                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                        className="w-12 h-10 p-1"
                                    />
                                    <Input
                                        value={newCategory.color}
                                        onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                                        className="flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                        <Button type="submit" disabled={loading}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Category
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Your Categories</CardTitle>
                    <CardDescription>{categories.length} categories configured</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.length === 0 ? (
                            <p className="text-sm text-muted-foreground col-span-full py-8 text-center border-dashed border rounded-lg">
                                No categories yet. Create one above!
                            </p>
                        ) : (
                            categories.map((cat) => (
                                <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="font-medium">{cat.name}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteCategory(cat.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
