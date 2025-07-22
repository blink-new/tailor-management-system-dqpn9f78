import { useState, useEffect } from 'react'
import { 
  Users, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp, 
  UserCheck,
  Calendar,
  AlertCircle,
  Clock
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { KPICard } from '@/components/dashboard/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { blink } from '@/blink/client'
import { Order } from '@/types'

export function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState({
    totalCustomers: 0,
    ordersThisMonth: 0,
    ordersDeliveredToday: 0,
    pendingPayments: 0,
    incomeThisMonth: 0,
    totalWorkers: 0
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [upcomingDeliveries, setUpcomingDeliveries] = useState<Order[]>([])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load KPI data
      const customers = await blink.db.customers.list()
      const orders = await blink.db.orders.list({ 
        orderBy: { createdAt: 'desc' },
        limit: 20 
      })
      const workers = await blink.db.workers.list()

      // Calculate KPIs
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const today = new Date().toDateString()

      const ordersThisMonth = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      })

      const ordersDeliveredToday = orders.filter(order => 
        order.status === 'delivered' && new Date(order.updatedAt).toDateString() === today
      )

      const pendingPayments = orders.reduce((sum, order) => sum + order.pendingAmount, 0)
      const incomeThisMonth = ordersThisMonth.reduce((sum, order) => sum + order.advancePaid, 0)

      setKpiData({
        totalCustomers: customers.length,
        ordersThisMonth: ordersThisMonth.length,
        ordersDeliveredToday: ordersDeliveredToday.length,
        pendingPayments,
        incomeThisMonth,
        totalWorkers: workers.length
      })

      setRecentOrders(orders.slice(0, 10))

      // Get upcoming deliveries (next 7 days)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const upcoming = orders.filter(order => {
        const deliveryDate = new Date(order.deliveryDate)
        return deliveryDate >= new Date() && deliveryDate <= nextWeek && order.status !== 'delivered'
      })
      
      setUpcomingDeliveries(upcoming)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      case 'paid': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (deliveryDate: string) => {
    return new Date(deliveryDate) < new Date()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
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

  const userRole = user.role || 'admin' // Default to admin for now

  return (
    <Layout title="Dashboard" userRole={userRole} userName={user.displayName}>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <KPICard
            title="Total Customers"
            value={kpiData.totalCustomers}
            icon={Users}
            trend={{ value: 12, isPositive: true }}
          />
          <KPICard
            title="Orders This Month"
            value={kpiData.ordersThisMonth}
            icon={ShoppingBag}
            trend={{ value: 8, isPositive: true }}
          />
          <KPICard
            title="Delivered Today"
            value={kpiData.ordersDeliveredToday}
            icon={Calendar}
          />
          <KPICard
            title="Pending Payments"
            value={`₹${kpiData.pendingPayments.toLocaleString()}`}
            icon={CreditCard}
            trend={{ value: -5, isPositive: false }}
          />
          <KPICard
            title="Income This Month"
            value={`₹${kpiData.incomeThisMonth.toLocaleString()}`}
            icon={TrendingUp}
            trend={{ value: 15, isPositive: true }}
          />
          <KPICard
            title="Total Workers"
            value={kpiData.totalWorkers}
            icon={UserCheck}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Orders
                <Button variant="outline" size="sm">View All</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders yet</p>
                ) : (
                  recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {order.garments.map(g => g.garmentType).join(', ')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">₹{order.totalAmount}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deliveries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Upcoming Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingDeliveries.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No upcoming deliveries</p>
                ) : (
                  upcomingDeliveries.map((order) => (
                    <div key={order.id} className={`flex items-center justify-between p-3 rounded-lg ${
                      isOverdue(order.deliveryDate) ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                    }`}>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-gray-600">
                          {order.garments.map(g => g.garmentType).join(', ')}
                        </p>
                        <div className="flex items-center mt-1">
                          {isOverdue(order.deliveryDate) && (
                            <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          <p className={`text-xs ${isOverdue(order.deliveryDate) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                            {isOverdue(order.deliveryDate) ? 'OVERDUE: ' : ''}
                            {new Date(order.deliveryDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                          {order.paymentStatus}
                        </Badge>
                        <p className="text-sm font-medium mt-1">₹{order.totalAmount}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}