import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Explicit CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Authenticate Request
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 2. Parse Environment Variables
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
        if (!RESEND_API_KEY) {
            throw new Error('Missing RESEND_API_KEY')
        }

        // 3. Parse Body
        const { to, subject, html, contactId } = await req.json()

        if (!to || !subject || !html) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // 4. Send Email via Resend
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'Onboarding <onboarding@resend.dev>', // Default Resend test domain
                to,
                subject,
                html,
            }),
        })

        const data = await res.json()

        if (!res.ok) {
            console.error('Resend Error:', data)
            throw new Error(data.message || 'Failed to send email')
        }

        // 5. Log to Timeline (Tasks Table)
        if (contactId) {
            // Create an entry in tasks/activities table to show in timeline
            await supabaseClient
                .from('tasks')
                .insert({
                    user_id: user.id,
                    contact_id: contactId,
                    title: `Sent Email: ${subject}`,
                    description: html, // Storing HTML for now, maybe strip tags for preview
                    status: 'done', // Completed activity
                    type: 'email',
                    priority: 3,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
