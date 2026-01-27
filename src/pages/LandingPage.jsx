import { ArrowRight, CheckCircle2, Zap, Users, BarChart3, Layout, Calendar, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingPage({ onLoginClick }) {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Navbar */}
            <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
                            S
                        </div>
                        SuperPlanner
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={onLoginClick}>Sign In</Button>
                        <Button onClick={onLoginClick}>Get Started <ArrowRight className="ml-2 w-4 h-4" /></Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center py-24 px-4 bg-gradient-to-b from-background to-muted/20">
                <div className="space-y-6 max-w-3xl animate-in slide-in-from-bottom-8 fade-in duration-700">
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60 pb-2">
                        Master Your Workflow.
                        <br />
                        <span className="text-foreground">Amplify Your Impact.</span>
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        The all-in-one workspace for tasks, projects, CRM, and campaigns.
                        Stop juggling simplified tools and start using a SuperPlanner.
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <Button size="lg" className="h-12 px-8 text-lg" onClick={onLoginClick}>
                            Start for Free
                        </Button>
                        <Button size="lg" variant="outline" className="h-12 px-8 text-lg" onClick={onLoginClick}>
                            Live Demo
                        </Button>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> No credit card required</span>
                        <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> 14-day free trial</span>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-muted/30">
                <div className="container px-4">
                    <div className="text-center mb-16 space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Everything you need</h2>
                        <p className="text-muted-foreground">Powerful features to manage your entire business.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={Layout}
                            title="Task Management"
                            description="Organize with Kanban boards, lists, and calendar views. Context-aware filtering keeps you focused."
                        />
                        <FeatureCard
                            icon={Users}
                            title="Integrated CRM"
                            description="Manage contacts and pipelines directly alongside your tasks. Never lose track of a lead."
                        />
                        <FeatureCard
                            icon={Zap}
                            title="Smart Automation"
                            description="Automate recurring tasks, workflows, and campaign steps. Save hours every week."
                        />
                        <FeatureCard
                            icon={BarChart3}
                            title="Analytics & Insights"
                            description="Visualize your productivity. Track time, completion rates, and project progress in real-time."
                        />
                        <FeatureCard
                            icon={Calendar}
                            title="Unified Calendar"
                            description="Syncs with your tasks and meetings. See your entire day at a glance without switching apps."
                        />
                        <FeatureCard
                            icon={Shield}
                            title="Data Security"
                            description="Enterprise-grade security. Trash and Archive features ensure you never lose important data."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t bg-muted/10">
                <div className="container px-4 text-center text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} SuperPlanner. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description }) {
    return (
        <div className="p-6 rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-xl mb-2">{title}</h3>
            <p className="text-muted-foreground">{description}</p>
        </div>
    )
}
