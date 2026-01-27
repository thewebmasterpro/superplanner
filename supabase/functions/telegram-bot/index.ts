import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

serve(async (req) => {
    try {
        const url = new URL(req.url)

        // 1. Webhook verification (optional but recommended)
        if (req.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 })
        }

        const update = await req.json()

        // 2. Handle Message
        if (update.message) {
            await handleMessage(update.message)
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Error handling webhook:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})

async function handleMessage(message: any) {
    const chatId = message.chat.id
    const text = message.text || ''
    const userId = await getUserIdByChatId(chatId)

    // Validate user (security)
    if (!userId) {
        return sendMessage(chatId, `⛔ Vous n'êtes pas autorisé.\n\nVotre Chat ID est : \`${chatId}\`\n\nVeuillez copier ce numéro et le coller dans les Réglages > Telegram de Superplanner.`, { parse_mode: 'Markdown' })
    }

    // Simple Command Handling
    if (text.startsWith('/start')) {
        return sendMessage(chatId, "👋 Bonjour ! Je suis **Lisa**, votre assistante Superplanner.\n\nJe suis là pour gérer vos tâches.\n\nDites-moi simplement :\n- `/add Faire les courses`\n- `tache Réunion à 14h`")
    }

    // AI-Powered Interaction with Gemini
    if (text) {
        // Show "typing..." status
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, action: 'typing' })
        })

        const aiResult = await processWithGemini(text)

        if (!aiResult || aiResult.error) {
            return sendMessage(chatId, `😓 Désolée, je suis un peu fatiguée (Erreur IA).\n\nDétail technique : ${aiResult?.error}`)
        }

        // Logic based on AI intent
        if (aiResult.action === 'create_task' || aiResult.action === 'create_meeting') {
            const { title, date, time, duration, priority, type } = aiResult

            // Construct timestamp if date provided
            let scheduledTime = null
            if (date) {
                // If time provided, combine. If not, default to 09:00 or just Date
                const timePart = time || '09:00'
                scheduledTime = new Date(`${date}T${timePart}:00`).toISOString()
            }

            const isMeeting = type === 'meeting'

            const { error } = await supabase.from('tasks').insert({
                user_id: userId,
                title: title,
                description: aiResult.description || '', // Add description
                agenda: aiResult.description || '', // Use description as agenda for meetings too
                status: 'todo',
                priority: priority || 2, // 1=High, 2=Medium, 3=Low
                type: isMeeting ? 'meeting' : 'task',
                scheduled_time: scheduledTime,
                duration: duration || (isMeeting ? 60 : null), // Default 1h for meetings
                created_at: new Date().toISOString()
            })

            if (error) {
                console.error('Db Error:', error)
                return sendMessage(chatId, "❌ Oups, erreur technique lors de la sauvegarde.")
            }

            const icon = isMeeting ? '📅' : '✅'
            const timeStr = scheduledTime ? ` pour le ${new Date(scheduledTime).toLocaleDateString()} à ${new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''

            return sendMessage(chatId, `${icon} C'est noté ! J'ai ajouté : **${title}**${timeStr}.`)
        } else {
            // Conversational fallback (Gemini didn't detect a clear task)
            return sendMessage(chatId, `🤔 ${aiResult.response || "Je n'ai pas compris. Voulez-vous ajouter une tâche ?"}`)
        }
    }
}

async function processWithGemini(text: string) {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) return { error: 'No API Key' }

    const now = new Date().toISOString()

    const prompt = `
    You are Lisa, a smart personal assistant for a Planner App.
    Current Time: ${now} (ISO).
    User Input: "${text}"

    Analyze the input to extract task or meeting details.
    
    RETURN JSON ONLY. Structure:
    {
      "action": "create_task" | "create_meeting" | "chat",
      "title": "Short title of the task/meeting",
      "description": "Any additional details, context, or agenda mentioned",
      "date": "YYYY-MM-DD" (Calculate based on Current Time. Default to Today if not specified but implies immediate action),
      "time": "HH:MM" (24h format. Default to 09:00 if not specified),
      "duration": 60 (integer, minutes),
      "priority": 2 (1=High, 2=Medium, 3=Low),
      "response": "Chat response if action is 'chat'"
    }
    
    Rules:
    - If user says "demain", calculate date relative to ${now}.
    - "Meeting" implies action="create_meeting". "Task" or "Reminder" implies "create_task".
    - If no date is mentioned, use null, UNLESS it's a meeting (default to today or tomorrow depending on context).
    - Description should contain any extra details that don't fit in the title.
    `

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(`API Error ${response.status}: ${errorBody}`)
        }

        const data = await response.json()
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!textResponse) throw new Error('No content in Gemini response')

        // Clean markdown code blocks if any
        const jsonStr = textResponse.replace(/^```json\n|\n```$/g, '').trim()

        return JSON.parse(jsonStr)
    } catch (e) {
        console.error("Gemini Error:", e)
        return { error: e.message }
    }
}

async function getUserIdByChatId(chatId: number) {
    // Find user who has this chat_id in their preferences logic
    // Since preferences are in a JSONB or separate table, we query it.
    // Assuming 'user_preferences' table has a 'telegram' column -> { chatId: "..." }

    const { data, error } = await supabase
        .from('user_preferences')
        .select('user_id, telegram')
        .limit(1000) // Fetch potential matches (optimization needed for scale)

    if (!data) return null

    // Filter in memory for now because extracting JSON path in Supabase can be tricky without specific index
    // Use String comparison to be safe (JSON stores strings, Telegram sends numbers)
    const match = data.find(p => String(p.telegram?.chatId) === String(chatId))
    return match ? match.user_id : null
}

async function sendMessage(chatId: number, text: string, options = {}) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            ...options
        })
    })
}
