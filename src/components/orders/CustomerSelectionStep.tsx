import { useState } from 'react'
import { Search, Plus, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Customer } from '@/types'
import { blink } from '@/blink/client'

interface CustomerSelectionStepProps {
  customers: Customer[]
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer) => void
  onCustomerCreate: (customer: Customer) => void
}

export function CustomerSelectionStep({
  customers,
  selectedCustomer,
  onCustomerSelect,
  onCustomerCreate
}: CustomerSelectionStepProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    mobile: '',
    address: '',
    email: ''
  })

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm)
  )

  const handleAddCustomer = async () => {
    try {
      if (!newCustomer.name || !newCustomer.mobile || !newCustomer.address) {
        alert('Please fill in all required fields')
        return
      }

      // Check for duplicate mobile number
      const existingCustomer = customers.find(c => c.mobile === newCustomer.mobile)
      if (existingCustomer) {
        alert(`Customer with mobile ${newCustomer.mobile} already exists: ${existingCustomer.name}`)
        return
      }

      const customer = await blink.db.customers.create({
        id: `cust_${Date.now()}`,
        name: newCustomer.name,
        mobile: newCustomer.mobile,
        address: newCustomer.address,
        email: newCustomer.email || '',
        totalOrders: 0,
        totalPaid: 0,
        totalPending: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      onCustomerCreate(customer)
      setNewCustomer({ name: '', mobile: '', address: '', email: '' })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Error adding customer. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Add Customer */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search customers by name or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  value={newCustomer.mobile}
                  onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div>
                <Label htmlFor="address">Address *</Label>
                <Textarea
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Customer address"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              <div className="flex space-x-2 pt-4">
                <Button onClick={handleAddCustomer} className="flex-1">
                  Save & Select Customer
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Customer */}
      {selectedCustomer && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-green-800">{selectedCustomer.name}</h3>
                  <p className="text-sm text-green-600">{selectedCustomer.mobile}</p>
                  <p className="text-sm text-green-600">{selectedCustomer.address}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => onCustomerSelect(null)}>
                Change Customer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer List */}
      {!selectedCustomer && (
        <div className="space-y-3">
          <h3 className="font-medium">Select Customer</h3>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No customers found matching your search' : 'No customers available'}
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Add a new customer to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-3 max-h-96 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <Card 
                  key={customer.id} 
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onCustomerSelect(customer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-600">{customer.mobile}</p>
                        <p className="text-sm text-gray-500 truncate max-w-xs">{customer.address}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{customer.totalOrders} orders</p>
                        {customer.totalPending > 0 && (
                          <p className="text-red-600">₹{customer.totalPending} pending</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}