import { useState, useEffect } from 'react'
import pb from '../lib/pocketbase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LoginPocketBase({ onLoginSuccess, isModal = false }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Hardcoded to true to ensure button visibility in production
    const googleEnabled = true

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const authData = await pb.collection('users').authWithPassword(email, password)
            onLoginSuccess({
                success: true,
                user: authData.record,
                session: authData.token
            })
        } catch (err) {
            console.error('Login error:', err)
            setError(err.message || "Failed to login")
        } finally {
            setLoading(false)
        }
    }

    const handleSignup = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data = {
                email,
                password,
                passwordConfirm: password,
                name: email.split('@')[0],
            }
            await pb.collection('users').create(data)

            const authData = await pb.collection('users').authWithPassword(email, password)
            onLoginSuccess({
                success: true,
                user: authData.record,
                session: authData.token
            })
        } catch (err) {
            console.error('Signup error:', err)
            let limitMsg = err.message || "Failed to sign up"
            if (err.data && err.data.data) {
                const fieldErrors = Object.entries(err.data.data)
                    .map(([field, error]) => `${field}: ${error.message}`)
                    .join(', ')
                if (fieldErrors) limitMsg += ` (${fieldErrors})`
            }
            setError(limitMsg)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try {
            const authData = await pb.collection('users').authWithOAuth2({ provider: 'google' });
            onLoginSuccess({
                success: true,
                user: authData.record,
                session: authData.token
            });
        } catch (err) {
            console.error("Google login error", err);
            const msg = err?.data?.message || err?.message || "Failed to login with Google";
            setError(msg);
        }
    }

    return (
        <div className={isModal ? "w-full" : "flex justify-center items-center min-h-[50vh] p-4"}>
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Superplanner</CardTitle>
                    <CardDescription className="text-center">
                        Task Management & CRM
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4 break-words">
                            {error}
                        </div>
                    )}

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Logging in...' : 'Login'}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form onSubmit={handleSignup} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signup-email">Email</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder="m@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="signup-password">Password</Label>
                                    <Input
                                        id="signup-password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? 'Creating account...' : 'Create Account'}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>

                    <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
                        Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
