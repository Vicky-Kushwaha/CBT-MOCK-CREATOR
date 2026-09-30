import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, LayoutDashboard, BrainCircuit, LineChart } from 'lucide-react';

export default function LandingPage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-paper overflow-hidden font-sans">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-rail to-rail-dark flex items-center justify-center text-white font-bold">
                M
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rail to-blue-600">
                MockMaster
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium text-ink-soft hover:text-ink transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary shadow-lg shadow-rail/20">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-rail text-sm font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rail opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rail"></span>
              </span>
              Next-Gen Assessment Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-ink leading-tight tracking-tight">
              Create and Take <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rail to-blue-500">
                Beautiful Mocks
              </span>
            </h1>
            <p className="text-lg text-ink-soft max-w-lg">
              Empower your learning and teaching with our state-of-the-art Computer Based Testing (CBT) platform. Build, share, and analyze mock exams effortlessly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn bg-rail text-white hover:bg-rail-dark shadow-xl shadow-rail/30 h-12 px-8 text-base rounded-full">
                Start Creating Free
              </Link>
              <a href="#features" className="btn border-2 border-slate-200 text-ink hover:bg-slate-50 h-12 px-8 text-base rounded-full">
                Explore Features
              </a>
            </div>
            

          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-rail rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white border border-slate-200/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 py-3 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between text-sm text-ink-soft mb-2">
                    <span className="font-semibold text-rail">Question 4</span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">+4 Marks</span>
                  </div>
                  
                  <div className="text-lg font-medium text-ink relative">
                    <p className="mb-4">Evaluate the integral:</p>
                    <div className="py-4 px-6 bg-slate-50 border border-slate-100 rounded-xl flex justify-center text-xl font-serif text-slate-800 shadow-inner relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-blue-400/10 blur-xl"></div>
                      <div className="relative z-10 flex items-center gap-3">
                        <span className="text-3xl">∫</span>
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-xs">π</span>
                          <span className="text-xs">0</span>
                        </div>
                        <span>sin(x) dx</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="relative p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="relative flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                        <span className="text-ink">0</span>
                      </div>
                    </div>
                    
                    <div className="relative p-3 rounded-lg border-2 border-rail bg-blue-50/30 shadow-sm">
                      <div className="absolute inset-0 bg-rail/10 blur-lg rounded-lg"></div>
                      <div className="relative flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-rail flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-rail"></div>
                        </div>
                        <span className="text-ink font-medium">2</span>
                      </div>
                    </div>

                    <div className="relative p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="relative flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
                        <span className="text-ink">π</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                    <button className="text-sm font-medium text-slate-500 hover:text-ink transition-colors">Mark for Review</button>
                    <button className="btn-primary shadow-lg shadow-rail/20 text-sm py-1.5 px-4 rounded-full">Save & Next</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-ink mb-4">Everything you need to master assessments</h2>
            <p className="text-ink-soft text-lg">Our platform provides end-to-end tools for creators and students, ensuring a seamless examination experience.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-paper border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-rail rounded-xl flex items-center justify-center mb-6">
                <LayoutDashboard size={24} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">Intuitive Dashboard</h3>
              <p className="text-ink-soft">Manage all your mocks, track progress, and access recent activity from a clean, unified interface.</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-paper border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-rail rounded-xl flex items-center justify-center mb-6">
                <BrainCircuit size={24} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">Real Exam Simulation</h3>
              <p className="text-ink-soft">Experience the exact look and feel of actual CBT exams to build confidence and time-management skills.</p>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="p-8 rounded-2xl bg-paper border border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-rail rounded-xl flex items-center justify-center mb-6">
                <LineChart size={24} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-3">Deep Analytics</h3>
              <p className="text-ink-soft">Get detailed insights into performance, subject-wise breakdowns, and actionable feedback.</p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-ink py-12 text-center text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-4 text-white">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-rail to-blue-500 flex items-center justify-center text-xs font-bold">
            M
          </div>
          <span className="font-bold">MockMaster</span>
        </div>
        <p>&copy; 2026 MockMaster Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
