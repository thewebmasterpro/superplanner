/**
 * AI Service
 * 
 * Handles interactions with the AI Semantic Search API (ChromaDB).
 * Base URL: https://ai.hagendigital.com
 */

class AIService {
    constructor() {
        this.baseUrl = 'https://ai.hagendigital.com'
        this.apiKey = import.meta.env.VITE_AI_API_KEY || '' // Configurable via .env
    }

    /**
     * Search for tasks using semantic similarity
     * @param {string} query - The search query 
     * @returns {Promise<Array>} List of relevant tasks with similarity scores
     */
    async search(query) {
        if (!query.trim()) return []

        try {
            // Mock implementation for development if no API key is set
            // In a real scenario, this would POST to the vector DB endpoint
            if (!this.apiKey && import.meta.env.DEV) {
                console.log('Using mock AI search for:', query)
                await new Promise(r => setTimeout(r, 600)) // Simulate network delay

                // Return dummy results that loosely match the query logic
                return [
                    {
                        id: 'mock_1',
                        title: 'Design Dashboard V3',
                        description: 'Refonte complète de l\'interface avec Tailwind et DaisyUI',
                        score: 0.92,
                        status: 'in_progress'
                    },
                    {
                        id: 'mock_2',
                        title: 'Intégration API AI',
                        description: 'Connecter le frontend à ChromaDB',
                        score: 0.85,
                        status: 'todo'
                    },
                    {
                        id: 'mock_3',
                        title: 'Optimisation SEO',
                        description: 'Revoir les balises meta de la landing page',
                        score: 0.76,
                        status: 'done'
                    }
                ].filter(t => t.title.toLowerCase().includes(query.toLowerCase()) || query.length < 3)
            }

            const response = await fetch(`${this.baseUrl}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({ query })
            })

            if (!response.ok) {
                throw new Error(`AI Search failed: ${response.statusText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('AI Service Error:', error)
            return [] // Fail gracefully
        }
    }
}

export const aiService = new AIService()
