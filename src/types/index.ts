export interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'tailor' | 'worker'
  mobile?: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  mobile: string
  address: string
  email?: string
  totalOrders: number
  totalPaid: number
  totalPending: number
  createdAt: string
  updatedAt: string
}

export interface GarmentType {
  id: string
  name: string
  isActive: boolean
  measurementFields: string[]
  subtypes: GarmentSubtype[]
}

export interface GarmentSubtype {
  id: string
  garmentTypeId: string
  category: string
  name: string
  options: string[]
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  garments: OrderGarment[]
  measurements: Record<string, number>
  totalAmount: number
  advancePaid: number
  pendingAmount: number
  paymentMode: 'cash' | 'upi' | 'card' | 'other'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  tailorId?: string
  tailorName?: string
  deliveryDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in_progress' | 'completed' | 'delivered'
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderGarment {
  garmentType: string
  subtypes: Record<string, string>
  quantity: number
  notes?: string
}

export interface Payment {
  id: string
  orderId: string
  customerId: string
  amount: number
  paymentMode: 'cash' | 'upi' | 'card' | 'other'
  paymentDate: string
  notes?: string
  createdAt: string
}

export interface Worker {
  id: string
  name: string
  mobile: string
  role: 'tailor' | 'worker'
  skills: string[]
  wageType: 'per_garment' | 'per_order' | 'monthly'
  wageAmount: number
  isActive: boolean
  assignedOrders: number
  completedOrders: number
  createdAt: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  orderId: string
  customerId: string
  amount: number
  status: 'pending' | 'paid'
  generatedAt: string
  paidAt?: string
}

export interface Measurement {
  id: string
  customerId: string
  measurements: Record<string, number>
  garmentTypes: string[]
  createdAt: string
}