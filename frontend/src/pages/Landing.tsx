import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { 
  Activity, 
  Heart, 
  KanbanSquare, 
  MessageSquare, 
  ArrowRight, 
  Users, 
  GitPullRequest, 
  Shield, 
  Zap,
  CheckCircle2,
  Star,
  Github,
  TrendingUp,
  Target
} from "lucide-react";

const InteractiveFeatureCarousel = () => {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [tiltValues, setTiltValues] = useState({ rotateX: 0, rotateY: 0 });

  const features = [
    {
      id: 0,
      title: "Repository Health",
      subtitle: "Real-time Monitoring",
      icon: Heart,
      content: {
        mainMetric: { label: "Health Score", value: "92", change: "+8%" },
        secondaryMetric: { label: "CI Stability", value: "98%", change: "+5%" },
        insight: "Your repository is performing above average with stable CI/CD"
      }
    },
    {
      id: 1,
      title: "PR Analytics",
      subtitle: "Smart Insights",
      icon: GitPullRequest,
      content: {
        mainMetric: { label: "Open PRs", value: "24", change: "Active" },
        secondaryMetric: { label: "Avg Review", value: "2.3h", change: "-15%" },
        insight: "PR review time improved by 15% this week"
      }
    },
    {
      id: 2,
      title: "Team Activity",
      subtitle: "Contributor Insights",
      icon: Users,
      content: {
        mainMetric: { label: "Contributors", value: "156", change: "+12" },
        secondaryMetric: { label: "Commits", value: "340", change: "This week" },
        insight: "Team activity increased 23% with 12 new contributors"
      }
    },
    {
      id: 3,
      title: "Project Planning",
      subtitle: "Feature Tracking",
      icon: KanbanSquare,
      content: {
        mainMetric: { label: "Features", value: "18", change: "In Progress" },
        secondaryMetric: { label: "Completed", value: "85%", change: "On Track" },
        insight: "85% of Q4 features are on track for delivery"
      }
    }
  ];

  const currentData = features[currentFeature];
  const Icon = currentData.icon;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;

    const rotateY = (mouseX / rect.width) * 12;
    const rotateX = -(mouseY / rect.height) * 8;

    setTiltValues({ rotateX, rotateY });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTiltValues({ rotateX: 0, rotateY: 0 });
  };

  useEffect(() => {
    if (!isHovering) {
      const interval = setInterval(() => {
        setCurrentFeature((prev) => (prev + 1) % features.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isHovering]);

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto"
      style={{ perspective: '1000px' }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Browser Chrome */}
      <div className="backdrop-blur-3xl px-4 py-3 rounded-t-xl bg-zinc-900/10">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 bg-zinc-900/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-zinc-500">
            app.repomind.dev
          </div>
        </div>
      </div>

      {/* Main Dashboard */}
      <div
        className="bg-white dark:bg-zinc-900 rounded-b-xl shadow-lg overflow-hidden transition-transform duration-300 border border-zinc-200 dark:border-zinc-800"
        style={{
          transform: `rotateX(${tiltValues.rotateX}deg) rotateY(${tiltValues.rotateY}deg)`,
        }}
      >
        {/* Feature Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800">
          {features.map((feature, index) => {
            const TabIcon = feature.icon;
            return (
              <button
                key={feature.id}
                onClick={() => setCurrentFeature(index)}
                className={`flex-1 p-3 text-xs transition-all relative ${
                  currentFeature === index
                    ? 'bg-zinc-50 dark:bg-zinc-800 text-amber-600'
                    : 'text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                {currentFeature === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600" />
                )}
                <div className="flex flex-col items-center gap-1">
                  <TabIcon className="w-4 h-4" />
                  <span className="hidden sm:block">{feature.title.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{currentData.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{currentData.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-green-600 font-medium">Live</span>
            </div>
          </div>

          {/* Main Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Primary Metric */}
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{currentData.content.mainMetric.label}</div>
              <div className="text-2xl font-bold text-amber-600">
                {currentData.content.mainMetric.value}
              </div>
              <div className="flex items-center text-sm text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                {currentData.content.mainMetric.change}
              </div>
            </div>

            {/* Secondary Metric */}
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">{currentData.content.secondaryMetric.label}</div>
              <div className="text-2xl font-bold text-amber-600">
                {currentData.content.secondaryMetric.value}
              </div>
              <div className="flex items-center text-sm text-blue-600 mt-1">
                <Target className="w-3 h-3 mr-1" />
                {currentData.content.secondaryMetric.change}
              </div>
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-1">AI Insight</div>
                <div className="text-sm text-zinc-700 dark:text-zinc-300">{currentData.content.insight}</div>
              </div>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentFeature(index)}
                className={`h-2 rounded-full transition-all ${
                  currentFeature === index ? 'w-8 bg-amber-600' : 'w-2 bg-zinc-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const features = [
  {
    icon: Heart,
    title: "Repo Health Monitoring",
    description:
      "Track CI stability, PR review latency, issue resolution time, and deployment health at a glance.",
  },
  {
    icon: KanbanSquare,
    title: "Project Planning Workspace",
    description:
      "Visualize features from planning to shipped with linked PRs and issues in a clean Kanban view.",
  },
  {
    icon: MessageSquare,
    title: "AI Assistant for Contributors",
    description:
      "Help new contributors understand the codebase, find issues to work on, and navigate the project.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Coordinate with your team, assign tasks, and track progress across all your repositories.",
  },
  {
    icon: GitPullRequest,
    title: "PR Analytics",
    description:
      "Understand merge patterns, review bottlenecks, and optimize your code review workflow.",
  },
  {
    icon: Shield,
    title: "Security Insights",
    description:
      "Monitor vulnerabilities, dependency updates, and security best practices in one place.",
  },
];

const stats = [
  { value: "10K+", label: "Repositories Tracked" },
  { value: "500K+", label: "PRs Analyzed" },
  { value: "50K+", label: "Contributors" },
  { value: "99.9%", label: "Uptime" },
];

const testimonials = [
  {
    quote: "RepoMind transformed how we manage our open-source projects. The health monitoring alone saved us countless hours.",
    author: "Sarah Chen",
    role: "Lead Maintainer, OpenCore",
    avatar: "SC",
  },
  {
    quote: "The AI assistant helps new contributors get up to speed in minutes instead of days. Game changer for onboarding.",
    author: "Marcus Johnson",
    role: "Engineering Manager, DevFlow",
    avatar: "MJ",
  },
  {
    quote: "Finally, a tool that understands the unique challenges of maintaining open-source software at scale.",
    author: "Elena Rodriguez",
    role: "OSS Director, TechCorp",
    avatar: "ER",
  },
];

const benefits = [
  "Real-time repository health scores",
  "Automated contributor insights",
  "AI-powered codebase navigation",
  "Integrated project planning",
  "Custom alerts and notifications",
  "Team performance analytics",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-amber-600" />
            <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">RepoMind</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Features</a>
            <a href="#testimonials" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Testimonials</a>
            <a href="#pricing" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Pricing</a>
          </nav>
          <Link 
            to="/workspace" 
            className="px-6 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition flex items-center gap-2 shadow-sm"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/30 to-transparent dark:from-amber-950/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(217,119,6,0.1),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-600/10 px-4 py-1.5 text-sm text-amber-600 mb-6">
                <Zap className="h-4 w-4" />
                Now with AI-powered insights
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl lg:text-6xl">
                Repository Workspace
                <br />
                <span className="text-amber-600">& Intelligence</span>
              </h1>
              <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400">
                Monitor repository health, plan features collaboratively, track contributions, and leverage AI to help your team understand and navigate the codebase.
              </p>
              <div className="mt-10 flex items-center gap-4 flex-wrap">
                <Link 
                  to="/auth"
                  className="px-8 py-4 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition flex items-center gap-2 shadow-sm"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <button className="px-8 py-4 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:border-amber-600 hover:text-amber-600 transition flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </button>
              </div>
            </div>

            {/* Interactive Carousel */}
            <div>
              <InteractiveFeatureCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-zinc-200 dark:border-zinc-800 bg-white/30 dark:bg-zinc-900/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-amber-600">{stat.value}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl lg:text-4xl">
              Everything you need to manage open-source
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              Built for admins, managers, and contributors working on open-source projects of any scale.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-amber-600/30 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex rounded-lg bg-amber-600/10 p-3 group-hover:bg-amber-600/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-28 bg-white/50 dark:bg-zinc-900/50 border-y border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl lg:text-4xl">
                Why teams choose RepoMind
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Join thousands of open-source maintainers and teams who trust RepoMind to keep their projects healthy and their contributors happy.
              </p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
                    <span className="text-zinc-900 dark:text-zinc-100">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-amber-600/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">Health Score</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Last updated 2 min ago</div>
                  </div>
                </div>
                <div className="text-5xl font-bold text-amber-600 mb-2">92</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Your repository is in great shape!</div>
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">24</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Open PRs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">12</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">156</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Contributors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl lg:text-4xl">
              Loved by maintainers worldwide
            </h2>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              See what open-source leaders are saying about RepoMind
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.author}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-600 text-amber-600" />
                  ))}
                </div>
                <p className="text-zinc-900 dark:text-zinc-100 leading-relaxed">"{testimonial.quote}"</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-600/10 flex items-center justify-center text-sm font-semibold text-amber-600">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">{testimonial.author}</div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-20 lg:py-28 bg-white/50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl lg:text-4xl">
            Ready to supercharge your repositories?
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Join thousands of open-source teams using RepoMind to build better software, faster.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Link 
              to="/workspace/demo"
              className="px-8 py-4 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition flex items-center gap-2 shadow-sm"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button className="px-8 py-4 border-2 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg font-semibold hover:border-amber-600 hover:text-amber-600 transition">
              Contact Sales
            </button>
          </div>
          <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
            No credit card required • Free for open-source projects
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-600" />
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">RepoMind</span>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Documentation</a>
              <a href="#" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Blog</a>
              <a href="#" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Privacy</a>
              <a href="#" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">Terms</a>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-600 dark:text-zinc-400">
            <p>© 2024 RepoMind — Repository workspace for open-source teams</p>
          </div>
        </div>
      </footer>
    </div>
  );
}