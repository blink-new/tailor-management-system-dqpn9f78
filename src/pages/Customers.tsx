import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Trash2, Users } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { blink } from '@/blink/client'
import { Customer } from '@/types'

export function Customers() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    mobile: '',
    address: '',
    email: ''
  })

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadCustomers = async () => {
    try {
      const customerData = await blink.db.customers.list({
        orderBy: { createdAt: 'desc' }
      })
      setCustomers(customerData)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadCustomers()
    }
  }, [user])

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

      setCustomers([customer, ...customers])
      setNewCustomer({ name: '', mobile: '', address: '', email: '' })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding customer:', error)
      alert('Error adding customer. Please try again.')
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
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
    <Layout title="Customer Management" userRole={userRole} userName={user.displayName}>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
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
                    Save Customer
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'No customers found matching your search' : 'No customers yet'}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  {searchTerm ? 'Try adjusting your search terms' : 'Add your first customer to get started'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Total Orders</TableHead>
                      <TableHead>Outstanding Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            {customer.email && (
                              <p className="text-sm text-gray-500">{customer.email}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{customer.mobile}</TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={customer.address}>
                            {customer.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{customer.totalOrders}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-right">
                            {customer.totalPending > 0 ? (
                              <Badge className="bg-red-100 text-red-800">
                                ₹{customer.totalPending.toLocaleString()}
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                ₹0
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {userRole === 'admin' && (
                              <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}