import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Eye, Users, Award, Clock, DollarSign } from 'lucide-react'
import { blink } from '../blink/client'
import type { Worker, Order } from '../types'

interface WorkerWithStats extends Worker {
  assignedOrders: number
  completedOrders: number
  pendingOrders: number
  totalEarnings: number
  averageDeliveryTime: number
  onTimePercentage: number
}

export default function Workers() {
  const [workers, setWorkers] = useState<WorkerWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<WorkerWithStats | null>(null)
  const [showWorkerProfile, setShowWorkerProfile] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    skills: '',
    wageType: 'per_garment' as 'per_garment' | 'per_order' | 'monthly',
    wageAmount: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0]
  })

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      const user = await blink.auth.me()
      
      // Get all workers
      const workersData = await blink.db.workers.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      // Get all orders to calculate stats
      const orders = await blink.db.orders.list({
        where: { userId: user.id }
      })

      // Calculate stats for each worker
      const workersWithStats: WorkerWithStats[] = workersData.map(worker => {
        const workerOrders = orders.filter(order => order.tailorId === worker.id)
        const completedOrders = workerOrders.filter(order => order.status === 'delivered')
        const pendingOrders = workerOrders.filter(order => order.status !== 'delivered')
        
        // Calculate total earnings (simplified - would need actual payment records)
        const totalEarnings = completedOrders.reduce((sum, order) => {
          if (worker.wageType === 'per_order') {
            return sum + (worker.wageAmount || 0)
          } else {
            // For per_garment, multiply by number of garments (simplified)
            return sum + (worker.wageAmount || 0) * 1 // Assuming 1 garment per order for now
          }
        }, 0)

        // Calculate average delivery time (simplified)
        const averageDeliveryTime = completedOrders.length > 0 ? 3 : 0 // Placeholder

        // Calculate on-time percentage (simplified)
        const onTimePercentage = completedOrders.length > 0 ? 85 : 0 // Placeholder

        return {
          ...worker,
          assignedOrders: workerOrders.length,
          completedOrders: completedOrders.length,
          pendingOrders: pendingOrders.length,
          totalEarnings,
          averageDeliveryTime,
          onTimePercentage
        }
      })

      setWorkers(workersWithStats)
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.mobile.includes(searchTerm) ||
    worker.skills.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddWorker = async () => {
    try {
      const user = await blink.auth.me()
      
      await blink.db.workers.create({
        id: `worker_${Date.now()}`,
        name: formData.name,
        mobile: formData.mobile,
        email: formData.email,
        skills: formData.skills,
        wageType: formData.wageType,
        wageAmount: parseFloat(formData.wageAmount) || 0,
        address: formData.address,
        joinDate: formData.joinDate,
        isActive: true,
        userId: user.id,
        createdAt: new Date().toISOString()
      })

      setShowAddModal(false)
      setFormData({
        name: '',
        mobile: '',
        email: '',
        skills: '',
        wageType: 'per_garment',
        wageAmount: '',
        address: '',
        joinDate: new Date().toISOString().split('T')[0]
      })
      fetchWorkers()
    } catch (error) {
      console.error('Error adding worker:', error)
      alert('Error adding worker')
    }
  }

  const viewWorkerProfile = (worker: WorkerWithStats) => {
    setSelectedWorker(worker)
    setShowWorkerProfile(true)
  }

  const getSkillBadgeColor = (skill: string) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800'
    ]
    return colors[skill.length % colors.length]
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
          <h1 className="text-2xl font-semibold text-gray-900">Worker Management</h1>
          <p className="mt-1 text-sm text-gray-500">Manage tailors and workers, track performance and assignments</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Worker
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, mobile, or skills..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkers.map((worker) => (
          <div key={worker.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{worker.name}</h3>
                <p className="text-sm text-gray-500">{worker.mobile}</p>
                {worker.email && <p className="text-sm text-gray-500">{worker.email}</p>}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => viewWorkerProfile(worker)}
                  className="text-blue-600 hover:text-blue-800"
                  title="View Profile"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-800"
                  title="Edit Worker"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Skills */}
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {worker.skills.split(',').map((skill, index) => (
                  <span
                    key={index}
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSkillBadgeColor(skill.trim())}`}
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{worker.assignedOrders}</div>
                <div className="text-xs text-gray-500">Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{worker.completedOrders}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{worker.pendingOrders}</div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{worker.onTimePercentage}%</div>
                <div className="text-xs text-gray-500">On Time</div>
              </div>
            </div>

            {/* Wage Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Wage:</span>
                <span className="font-medium">
                  ₹{worker.wageAmount} {worker.wageType === 'per_garment' ? '/garment' : worker.wageType === 'per_order' ? '/order' : '/month'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-500">Total Earnings:</span>
                <span className="font-medium text-green-600">₹{worker.totalEarnings.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredWorkers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No workers found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm
              ? 'Try adjusting your search criteria.'
              : 'Get started by adding your first worker or tailor.'}
          </p>
        </div>
      )}

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Worker</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills *</label>
                  <input
                    type="text"
                    placeholder="e.g., Shirts, Pants, Alterations (comma separated)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.skills}
                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wage Type *</label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.wageType}
                      onChange={(e) => setFormData({...formData, wageType: e.target.value as any})}
                    >
                      <option value="per_garment">Per Garment</option>
                      <option value="per_order">Per Order</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      value={formData.wageAmount}
                      onChange={(e) => setFormData({...formData, wageAmount: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddWorker}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Add Worker
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Worker Profile Modal */}
      {showWorkerProfile && selectedWorker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">{selectedWorker.name}</h3>
                  <p className="text-sm text-gray-500">{selectedWorker.mobile}</p>
                </div>
                <button
                  onClick={() => setShowWorkerProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Assigned Orders</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedWorker.assignedOrders}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Completed</p>
                      <p className="text-2xl font-bold text-green-900">{selectedWorker.completedOrders}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-orange-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-orange-600">On Time %</p>
                      <p className="text-2xl font-bold text-orange-900">{selectedWorker.onTimePercentage}%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Total Earnings</p>
                      <p className="text-2xl font-bold text-purple-900">₹{selectedWorker.totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Worker Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Worker Information</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Email:</span>
                      <span className="text-sm text-gray-900">{selectedWorker.email || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Join Date:</span>
                      <span className="text-sm text-gray-900">{new Date(selectedWorker.joinDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Wage Type:</span>
                      <span className="text-sm text-gray-900 capitalize">{selectedWorker.wageType.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Wage Amount:</span>
                      <span className="text-sm text-gray-900">₹{selectedWorker.wageAmount}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorker.skills.split(',').map((skill, index) => (
                      <span
                        key={index}
                        className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getSkillBadgeColor(skill.trim())}`}
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}