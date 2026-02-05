import { ArrowRight, CheckCircle2, Zap, Users, BarChart3, Layout, Calendar, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingPage({ onLoginClick }) {
    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950">
            {/* Animated gradient background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900"></div>
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/40 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-fuchsia-600/20 rounded-full blur-3xl"></div>
            </div>

            {/* Glass Navbar */}
            <nav className="sticky top-0 z-50 border-b border-white/10 relative">
                <div className="backdrop-blur-xl bg-black/30 shadow-lg shadow-purple-500/10">
                    <div className="container flex h-16 items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-xl">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/50">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">SuperPlanner</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onLoginClick}
                                className="px-4 py-2 rounded-xl font-medium text-white/90 hover:bg-white/10 transition-all duration-200"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={onLoginClick}
                                className="px-6 py-2 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 hover:scale-105 transition-all duration-200 flex items-center gap-2"
                            >
                                Get Started <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="flex-1 flex flex-col items-center justify-center text-center py-32 px-4 relative z-10">
                <div className="space-y-8 max-w-4xl">
                    {/* Floating badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 shadow-lg shadow-purple-500/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">The Future of Productivity</span>
                    </div>

                    {/* Main heading */}
                    <h1 className="text-5xl sm:text-7xl font-bold tracking-tight lg:text-8xl animate-in slide-in-from-bottom-8 fade-in duration-700 delay-150">
                        <span className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                            Master Your
                        </span>
                        <br />
                        <span className="text-white">
                            Workflow
                        </span>
                    </h1>

                    {/* Description */}
                    <p className="text-xl sm:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        The all-in-one workspace for tasks, projects, CRM, and campaigns.
                        <span className="font-semibold text-white"> Beautifully designed.</span>
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                        <button
                            onClick={onLoginClick}
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-2xl shadow-purple-500/50 hover:shadow-3xl hover:shadow-purple-500/70 hover:scale-105 transition-all duration-300"
                        >
                            Start for Free
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-lg backdrop-blur-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 shadow-lg shadow-white/10"
                        >
                            Live Demo
                        </button>
                    </div>

                    {/* Trust badges */}
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm animate-in fade-in duration-700 delay-700">
                        <span className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-slate-200">No credit card required</span>
                        </span>
                        <span className="flex items-center gap-2 px-4 py-2 rounded-xl backdrop-blur-xl bg-white/10 border border-white/20">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-slate-200">14-day free trial</span>
                        </span>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-32 px-4 relative z-10">
                <div className="container">
                    <div className="text-center mb-20 space-y-4">
                        <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                            Everything you need
                        </h2>
                        <p className="text-lg text-slate-300">Powerful features to manage your entire business.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        <FeatureCard
                            icon={Layout}
                            title="Task Management"
                            description="Organize with Kanban boards, lists, and calendar views. Workspace-aware filtering keeps you focused."
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
            <footer className="py-12 border-t border-white/10 backdrop-blur-xl bg-black/30 relative z-10">
                <div className="container px-4 text-center text-slate-400">
                    <p>&copy; {new Date().getFullYear()} SuperPlanner. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, description }) {
    return (
        <div className="group relative p-8 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300">
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative z-10">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">{title}</h3>
                <p className="text-slate-300 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
