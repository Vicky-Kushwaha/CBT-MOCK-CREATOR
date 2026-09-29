import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AnalyticsPage from './pages/AnalyticsPage'
import CreateMockPage from './pages/CreateMockPage'
import Dashboard from './pages/Dashboard'
import ExamPage from './pages/ExamPage'
import Login from './pages/Login'
import MockInstructions from './pages/MockInstructions'
import Register from './pages/Register'
import ResultPage from './pages/ResultPage'
import MockTestsPage from './pages/MockTestsPage'

import McpGuidePage from './pages/McpGuidePage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/exam/:sessionId" element={<ExamPage />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tests" element={<MockTestsPage />} />
          <Route path="/create" element={<CreateMockPage />} />
          <Route path="/mocks/:id/instructions" element={<MockInstructions />} />
          <Route path="/result/:sessionId" element={<ResultPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/mcp" element={<McpGuidePage />} />
        </Route>
      </Route>
      <Route path="*" element={<div className="p-10 text-center">Page not found.</div>} />
    </Routes>
  )
}
