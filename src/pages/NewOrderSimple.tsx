import { useState, useEffect } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { blink } from '@/blink/client'
import { Customer, GarmentType, Worker } from '@/types'
import { useNavigate } from 'react-router-dom'

export function NewOrderSimple() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Form data
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [garmentTypes, setGarmentTypes] = useState<GarmentType[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  
  const [orderData, setOrderData] = useState({
    garmentType: '',
    quantity: 1,
    totalAmount: 0,
    advancePaid: 0,
    deliveryDate: '',
    tailorId: '',
    notes: ''
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadData = async () => {
    try {
      const [customersData, garmentTypesData, workersData] = await Promise.all([
        blink.db.customers.list({ orderBy: { name: 'asc' } }),
        blink.db.garmentTypes.list({ where: { isActive: "1" } }),
        blink.db.workers.list({ where: { isActive: "1", role: 'tailor' } })
      ])
      
      setCustomers(customersData)
      setGarmentTypes(garmentTypesData)
      setWorkers(workersData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  const handleCreateOrder = async () => {
    try {
      if (!selectedCustomer || !orderData.garmentType || !orderData.deliveryDate) {
        alert('Please fill in all required fields')
        return
      }

      const orderId = `ORD_${Date.now()}`
      const selectedTailor = workers.find(w => w.id === orderData.tailorId)
      const pendingAmount = orderData.totalAmount - orderData.advancePaid
      
      await blink.db.orders.create({
        id: orderId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        garments: [{
          garmentType: orderData.garmentType,
          subtypes: {},
          quantity: orderData.quantity,
          notes: orderData.notes
        }],
        measurements: {},
        totalAmount: orderData.totalAmount,
        advancePaid: orderData.advancePaid,
        pendingAmount: pendingAmount,
        paymentMode: 'cash',
        paymentStatus: orderData.advancePaid >= orderData.totalAmount ? 'paid' : orderData.advancePaid > 0 ? 'partial' : 'unpaid',
        tailorId: orderData.tailorId,
        tailorName: selectedTailor?.name,
        deliveryDate: orderData.deliveryDate,
        priority: 'medium',
        status: 'pending',
        notes: orderData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      // Update customer totals
      await blink.db.customers.update(selectedCustomer.id, {
        totalOrders: selectedCustomer.totalOrders + 1,
        totalPending: selectedCustomer.totalPending + pendingAmount,
        updatedAt: new Date().toISOString()
      })

      // Create invoice
      const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`
      await blink.db.invoices.create({
        id: `inv_${Date.now()}`,
        invoiceNumber,
        orderId,
        customerId: selectedCustomer.id,
        amount: orderData.totalAmount,
        status: orderData.advancePaid >= orderData.totalAmount ? 'paid' : 'pending',
        generatedAt: new Date().toISOString(),
        paidAt: orderData.advancePaid >= orderData.totalAmount ? new Date().toISOString() : undefined
      })

      alert('Order created successfully!')
      navigate('/orders')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error creating order. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to continue</p>
          <Button onClick={() => blink.auth.login()} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const userRole = user.role || 'admin'

  return (
    <Layout title="New Order" userRole={userRole} userName={user.displayName}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/orders')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Order</h1>
            <p className="text-gray-600">Quick order creation form</p>
          </div>
        </div>

        {/* Order Form */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Selection */}
            <div>
              <Label>Customer *</Label>
              <Select onValueChange={(value) => {
                const customer = customers.find(c => c.id === value)
                setSelectedCustomer(customer || null)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} - {customer.mobile}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Garment Type */}
            <div>
              <Label>Garment Type *</Label>
              <Select onValueChange={(value) => setOrderData({...orderData, garmentType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select garment type" />
                </SelectTrigger>
                <SelectContent>
                  {garmentTypes.map((garment) => (
                    <SelectItem key={garment.id} value={garment.name}>
                      {garment.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity */}
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={orderData.quantity}
                onChange={(e) => setOrderData({...orderData, quantity: parseInt(e.target.value) || 1})}
                min="1"
              />
            </div>

            {/* Total Amount */}
            <div>
              <Label>Total Amount (₹) *</Label>
              <Input
                type="number"
                value={orderData.totalAmount}
                onChange={(e) => setOrderData({...orderData, totalAmount: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>

            {/* Advance Paid */}
            <div>
              <Label>Advance Paid (₹)</Label>
              <Input
                type="number"
                value={orderData.advancePaid}
                onChange={(e) => setOrderData({...orderData, advancePaid: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                max={orderData.totalAmount}
              />
            </div>

            {/* Delivery Date */}
            <div>
              <Label>Delivery Date *</Label>
              <Input
                type="date"
                value={orderData.deliveryDate}
                onChange={(e) => setOrderData({...orderData, deliveryDate: e.target.value})}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Tailor Assignment */}
            <div>
              <Label>Assign Tailor</Label>
              <Select onValueChange={(value) => setOrderData({...orderData, tailorId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tailor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {workers.map((worker) => (
                    <SelectItem key={worker.id} value={worker.id}>
                      {worker.name} - {worker.skills.join(', ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label>Notes</Label>
              <Input
                value={orderData.notes}
                onChange={(e) => setOrderData({...orderData, notes: e.target.value})}
                placeholder="Any special instructions..."
              />
            </div>

            {/* Summary */}
            {orderData.totalAmount > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span>₹{orderData.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Advance Paid:</span>
                    <span>₹{orderData.advancePaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Pending Amount:</span>
                    <span>₹{(orderData.totalAmount - orderData.advancePaid).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <Button 
              onClick={handleCreateOrder}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!selectedCustomer || !orderData.garmentType || !orderData.deliveryDate || orderData.totalAmount <= 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}