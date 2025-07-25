import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Dashboard } from '@/pages/Dashboard'
import { Customers } from '@/pages/Customers'
import { Orders } from '@/pages/Orders'
import { NewOrderSimple as NewOrder } from '@/pages/NewOrderSimple'
import Payments from './pages/Payments'
import Workers from './pages/Workers'
import Reports from './pages/Reports'
import Invoices from './pages/Invoices'

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
          <Route path="/reports" element={<Reports />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/settings" element={<div className="p-8 text-center">Settings page coming soon...</div>} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App