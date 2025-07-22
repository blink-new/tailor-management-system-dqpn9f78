import React, { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Plus, Eye, CreditCard, Calendar, Download, CheckCircle } from 'lucide-react'
import { blink } from '../blink/client'
import type { Order, Customer, Payment } from '../types'

interface PaymentWithDetails extends Payment {
  customer_name: string
  customer_mobile: string
  garments: string
  order_total: number
}

export default function Payments() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')
  const [showCollectModal, setShowCollectModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null)
  const [collectAmount, setCollectAmount] = useState('')
  const [collectMode, setCollectMode] = useState('cash')
  const [collectNotes, setCollectNotes] = useState('')

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // Get all orders with customer and payment details
      const orders = await blink.db.orders.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      const customers = await blink.db.customers.list({
        where: { userId: user.id }
      })

      const customerMap = customers.reduce((acc, customer) => {
        acc[customer.id] = customer
        return acc
      }, {} as Record<string, Customer>)

      // Transform orders into payment records
      const paymentRecords: PaymentWithDetails[] = orders.map(order => {
        const customer = customerMap[order.customerId]
        const pendingAmount = order.totalAmount - order.advancePaid
        
        let paymentStatus = 'unpaid'
        if (order.advancePaid === order.totalAmount) {
          paymentStatus = 'paid'
        } else if (order.advancePaid > 0) {
          paymentStatus = 'partial'
        }

        return {
          id: `payment_${order.id}`,
          orderId: order.id,
          customerId: order.customerId,
          amount: order.advancePaid,
          pendingAmount,
          paymentMode: order.paymentMode || 'cash',
          paymentStatus,
          paymentDate: order.createdAt,
          notes: order.notes || '',
          userId: user.id,
          createdAt: order.createdAt,
          customer_name: customer?.name || 'Unknown',
          customer_mobile: customer?.mobile || '',
          garments: order.garments || 'N/A',
          order_total: order.totalAmount
        }
      })

      setPayments(paymentRecords)
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPayments = useCallback(() => {
    let filtered = payments

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment =>
        payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.customer_mobile.includes(searchTerm) ||
        payment.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentStatus === statusFilter)
    }

    // Payment mode filter
    if (paymentModeFilter !== 'all') {
      filtered = filtered.filter(payment => payment.paymentMode === paymentModeFilter)
    }

    setFilteredPayments(filtered)
  }, [payments, searchTerm, statusFilter, paymentModeFilter])

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    filterPayments()
  }, [filterPayments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      case 'unpaid': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCollectPayment = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment)
    setCollectAmount(payment.pendingAmount.toString())
    setCollectMode('cash')
    setCollectNotes('')
    setShowCollectModal(true)
  }

  const confirmPaymentCollection = async () => {
    if (!selectedPayment) return

    try {
      const amount = parseFloat(collectAmount)
      if (amount <= 0 || amount > selectedPayment.pendingAmount) {
        alert('Invalid amount')
        return
      }

      const user = await blink.auth.me()
      const newAdvancePaid = selectedPayment.amount + amount
      const newPendingAmount = selectedPayment.order_total - newAdvancePaid
      
      let newStatus = 'partial'
      if (newPendingAmount === 0) {
        newStatus = 'paid'
      } else if (newAdvancePaid === 0) {
        newStatus = 'unpaid'
      }

      // Update the order with new payment information
      await blink.db.orders.update(selectedPayment.orderId, {
        advancePaid: newAdvancePaid,
        paymentMode: collectMode,
        paymentStatus: newStatus,
        notes: collectNotes || selectedPayment.notes
      })

      // Create a payment record
      await blink.db.payments.create({
        id: `pay_${Date.now()}`,
        orderId: selectedPayment.orderId,
        customerId: selectedPayment.customerId,
        amount: amount,
        paymentMode: collectMode,
        paymentDate: new Date().toISOString(),
        notes: collectNotes,
        userId: user.id,
        createdAt: new Date().toISOString()
      })

      // Update customer total
      const customer = await blink.db.customers.list({
        where: { id: selectedPayment.customerId }
      })
      
      if (customer.length > 0) {
        const currentCustomer = customer[0]
        await blink.db.customers.update(selectedPayment.customerId, {
          totalPaid: (currentCustomer.totalPaid || 0) + amount,
          outstandingAmount: Math.max(0, (currentCustomer.outstandingAmount || 0) - amount)
        })
      }

      setShowCollectModal(false)
      setSelectedPayment(null)
      fetchPayments() // Refresh the data
    } catch (error) {
      console.error('Error collecting payment:', error)
      alert('Error processing payment')
    }
  }

  const downloadReceipt = async (payment: PaymentWithDetails) => {
    // This would generate a PDF receipt
    alert(`Receipt for Order ${payment.orderId} would be downloaded`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payment Management</h1>
          <p className="mt-1 text-sm text-gray-500">Track and collect payments from customers</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Manual Payment Entry
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by customer, mobile, or order ID..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>

          {/* Payment Mode Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={paymentModeFilter}
            onChange={(e) => setPaymentModeFilter(e.target.value)}
          >
            <option value="all">All Payment Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="other">Other</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <input
              type="date"
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Garments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Advance Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => {/* Navigate to order details */}}
                    >
                      {payment.orderId}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{payment.customer_name}</div>
                      <div className="text-sm text-gray-500">{payment.customer_mobile}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.garments}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{payment.order_total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{payment.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    ₹{payment.pendingAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.paymentStatus)}`}>
                      {payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {payment.paymentMode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {payment.pendingAmount > 0 && (
                      <button
                        onClick={() => handleCollectPayment(payment)}
                        className="text-green-600 hover:text-green-800"
                        title="Collect Payment"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadReceipt(payment)}
                      className="text-gray-600 hover:text-gray-800"
                      title="Download Receipt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || paymentModeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first order.'}
            </p>
          </div>
        )}
      </div>

      {/* Collect Payment Modal */}
      {showCollectModal && selectedPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Collect Payment</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer: {selectedPayment.customer_name}
                  </label>
                  <label className="block text-sm text-gray-500">
                    Order: {selectedPayment.orderId}
                  </label>
                  <label className="block text-sm text-gray-500">
                    Pending Amount: ₹{selectedPayment.pendingAmount.toLocaleString()}
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount to Collect *
                  </label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={collectAmount}
                    onChange={(e) => setCollectAmount(e.target.value)}
                    max={selectedPayment.pendingAmount}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={collectMode}
                    onChange={(e) => setCollectMode(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    placeholder="Payment notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCollectModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPaymentCollection}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Collect Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}