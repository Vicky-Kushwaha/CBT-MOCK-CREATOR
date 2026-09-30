import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export default function AuthShell({ title, children, illustration }: { title: string; children: ReactNode; illustration?: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper font-sans overflow-hidden">
      {/* Left side - Branding/Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-ink to-rail-dark flex-col justify-between p-12 text-white overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-10 h-10 rounded bg-white text-rail font-bold flex items-center justify-center text-lg">M</div>
          <span className="text-2xl font-bold tracking-tight">MockMaster</span>
        </div>

        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {illustration || (
              <>
                <h2 className="text-4xl font-bold mb-4 leading-tight">Elevate your <br/><span className="text-blue-300">assessment</span> experience</h2>
                <p className="text-lg text-blue-100 max-w-md">Join thousands of creators building high-quality mocks. Seamlessly design, distribute, and analyze exams.</p>
              </>
            )}
          </motion.div>
        </div>
        
        <div className="relative z-10 flex gap-4 text-sm text-blue-200">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white relative">
        <Link to="/" className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-rail to-rail-dark text-white font-bold flex items-center justify-center text-sm">M</div>
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-ink mb-2">Welcome</h1>
            <p className="text-ink-soft">{title}</p>
          </div>
          
          <div className="bg-white">
            {children}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
