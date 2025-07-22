import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Download, TrendingUp, TrendingDown, Users, Package, DollarSign, Clock } from 'lucide-react'
import { blink } from '@/blink/client'
import type { Customer, Order, Worker } from '@/types'

interface RevenueData {
  totalRevenue: number
  totalOrders: number
  revenueGrowth: number
  pendingPayments: number
  weeklyRevenue: { week: string; amount: number }[]
  paymentModeBreakdown: { mode: string; amount: number; percentage: number }[]
}

interface GarmentAnalytics {
  garmentBreakdown: { type: string; count: number; percentage: number }[]
  weeklyGarments: { week: string; count: number }[]
}

interface TopCustomer {
  id: string
  name: string
  totalOrders: number
  totalRevenue: number
  lastOrderDate: string
}

interface TailorPerformance {
  id: string
  name: string
  ordersAssigned: number
  ordersCompleted: number
  averageDeliveryTime: number
  onTimePercentage: number
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')
  const [paymentModeFilter, setPaymentModeFilter] = useState('all')
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [garmentAnalytics, setGarmentAnalytics] = useState<GarmentAnalytics | null>(null)
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([])
  const [tailorPerformance, setTailorPerformance] = useState<TailorPerformance[]>([])

  const loadReportsData = React.useCallback(async () => {
    try {
      setLoading(true)
      
      // Load orders and customers for analytics
      const [orders, customers, workers] = await Promise.all([
        blink.db.orders.list(),
        blink.db.customers.list(),
        blink.db.workers.list()
      ])

      // Calculate revenue data
      const currentDate = new Date()
      const daysBack = parseInt(dateRange)
      const startDate = new Date(currentDate.getTime() - (daysBack * 24 * 60 * 60 * 1000))
      
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startDate
      })

      const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.advancePaid || 0), 0)
      const totalOrders = filteredOrders.length
      const pendingPayments = filteredOrders.reduce((sum, order) => sum + (order.pendingAmount || 0), 0)

      // Calculate weekly revenue
      const weeklyRevenue = []
      for (let i = 0; i < Math.min(4, Math.ceil(daysBack / 7)); i++) {
        const weekStart = new Date(currentDate.getTime() - ((i + 1) * 7 * 24 * 60 * 60 * 1000))
        const weekEnd = new Date(currentDate.getTime() - (i * 7 * 24 * 60 * 60 * 1000))
        const weekOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt)
          return orderDate >= weekStart && orderDate < weekEnd
        })
        const weekAmount = weekOrders.reduce((sum, order) => sum + (order.advancePaid || 0), 0)
        weeklyRevenue.unshift({
          week: `Week ${i + 1}`,
          amount: weekAmount
        })
      }

      // Calculate payment mode breakdown
      const paymentModes = ['cash', 'upi', 'card', 'other']
      const paymentModeBreakdown = paymentModes.map(mode => {
        const modeOrders = filteredOrders.filter(order => order.paymentMode === mode)
        const amount = modeOrders.reduce((sum, order) => sum + (order.advancePaid || 0), 0)
        return {
          mode: mode.toUpperCase(),
          amount,
          percentage: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
        }
      })

      setRevenueData({
        totalRevenue,
        totalOrders,
        revenueGrowth: Math.floor(Math.random() * 20) - 10, // Mock growth calculation
        pendingPayments,
        weeklyRevenue,
        paymentModeBreakdown
      })

      // Calculate garment analytics
      const garmentTypes = ['Shirt', 'Pant', 'Kurta', 'Blazer']
      const garmentBreakdown = garmentTypes.map(type => {
        const typeOrders = filteredOrders.filter(order => 
          order.garments && order.garments.toLowerCase().includes(type.toLowerCase())
        )
        return {
          type,
          count: typeOrders.length,
          percentage: totalOrders > 0 ? Math.round((typeOrders.length / totalOrders) * 100) : 0
        }
      })

      const weeklyGarments = weeklyRevenue.map(week => ({
        week: week.week,
        count: Math.floor(Math.random() * 20) + 5 // Mock data
      }))

      setGarmentAnalytics({
        garmentBreakdown,
        weeklyGarments
      })

      // Calculate top customers
      const customerStats = customers.map(customer => {
        const customerOrders = orders.filter(order => order.customerId === customer.id)
        const totalRevenue = customerOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
        const lastOrder = customerOrders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
        
        return {
          id: customer.id,
          name: customer.name,
          totalOrders: customerOrders.length,
          totalRevenue,
          lastOrderDate: lastOrder ? lastOrder.createdAt : 'Never'
        }
      }).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10)

      setTopCustomers(customerStats)

      // Calculate tailor performance
      const tailorStats = workers.map(worker => {
        const assignedOrders = orders.filter(order => order.assignedTailor === worker.id)
        const completedOrders = assignedOrders.filter(order => order.status === 'delivered')
        
        return {
          id: worker.id,
          name: worker.name,
          ordersAssigned: assignedOrders.length,
          ordersCompleted: completedOrders.length,
          averageDeliveryTime: Math.floor(Math.random() * 10) + 3, // Mock data
          onTimePercentage: assignedOrders.length > 0 ? 
            Math.round((completedOrders.length / assignedOrders.length) * 100) : 0
        }
      })

      setTailorPerformance(tailorStats)

    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    loadReportsData()
  }, [loadReportsData])

  const exportReport = (format: string) => {
    // Mock export functionality
    alert(`Exporting report as ${format.toUpperCase()}...`)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track business performance and make data-driven decisions</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => exportReport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="garments">Garments</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="tailors">Tailors</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{revenueData?.totalRevenue.toLocaleString()}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {revenueData && revenueData.revenueGrowth > 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                  )}
                  {Math.abs(revenueData?.revenueGrowth || 0)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{revenueData?.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Orders in selected period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">₹{revenueData?.pendingPayments.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Amount to be collected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{revenueData && revenueData.totalOrders > 0 ? 
                    Math.round(revenueData.totalRevenue / revenueData.totalOrders).toLocaleString() : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per order average
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Revenue Trend</CardTitle>
                <CardDescription>Revenue breakdown by week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData?.weeklyRevenue.map((week, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${revenueData.totalRevenue > 0 ? 
                                (week.amount / revenueData.totalRevenue) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">₹{week.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Mode Breakdown</CardTitle>
                <CardDescription>Revenue by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData?.paymentModeBreakdown.map((mode, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{mode.mode}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-amber-500 h-2 rounded-full" 
                            style={{ width: `${mode.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{mode.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Garments Tab */}
        <TabsContent value="garments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Garment Type Distribution</CardTitle>
                <CardDescription>Orders by garment category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {garmentAnalytics?.garmentBreakdown.map((garment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{garment.type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${garment.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{garment.count} ({garment.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Garment Orders</CardTitle>
                <CardDescription>Order volume by week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {garmentAnalytics?.weeklyGarments.map((week, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{week.week}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.max(...(garmentAnalytics?.weeklyGarments.map(w => w.count) || [1])) > 0 ? 
                                (week.count / Math.max(...(garmentAnalytics?.weeklyGarments.map(w => w.count) || [1]))) * 100 : 0}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{week.count} orders</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Customers ranked by total revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">Last order: {customer.lastOrderDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">₹{customer.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{customer.totalOrders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tailors Tab */}
        <TabsContent value="tailors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tailor Performance</CardTitle>
              <CardDescription>Performance metrics for all tailors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tailorPerformance.map((tailor) => (
                  <div key={tailor.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{tailor.name}</h3>
                      <Badge variant={tailor.onTimePercentage >= 80 ? "default" : "secondary"}>
                        {tailor.onTimePercentage}% On-time
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Assigned</p>
                        <p className="font-bold">{tailor.ordersAssigned}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Completed</p>
                        <p className="font-bold">{tailor.ordersCompleted}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Delivery</p>
                        <p className="font-bold">{tailor.averageDeliveryTime} days</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}