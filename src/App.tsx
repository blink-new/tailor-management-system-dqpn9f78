import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Dashboard } from '@/pages/Dashboard'
import { Customers } from '@/pages/Customers'
import { Orders } from '@/pages/Orders'
import { NewOrderSimple as NewOrder } from '@/pages/NewOrderSimple'
import Payments from './pages/Payments'
import Workers from './pages/Workers'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/workers" element={<Workers />} />
          {/* Placeholder routes for future pages */}
          <Route path="/reports" element={<div className="p-8 text-center">Reports page coming soon...</div>} />
          <Route path="/invoices" element={<div className="p-8 text-center">Invoices page coming soon...</div>} />
          <Route path="/settings" element={<div className="p-8 text-center">Settings page coming soon...</div>} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App