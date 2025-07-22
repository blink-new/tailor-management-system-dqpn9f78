import { FileText, User, Package, Ruler, CreditCard, UserCheck, Check, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrderFormData } from '@/pages/NewOrder'

interface ReviewStepProps {
  formData: OrderFormData
  onCreateOrder: () => void
}

export function ReviewStep({
  formData,
  onCreateOrder
}: ReviewStepProps) {

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      case 'paid': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Order Summary Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-800">
            <FileText className="w-5 h-5 mr-2" />
            Order Review & Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700">
            Please review all the details below before creating the order. 
            Once created, an invoice will be generated automatically.
          </p>
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.customer ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{formData.customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Mobile:</span>
                <span>{formData.customer.mobile}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Address:</span>
                <span className="text-right max-w-xs">{formData.customer.address}</span>
              </div>
              {formData.customer.email && (
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{formData.customer.email}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">No customer selected</p>
          )}
        </CardContent>
      </Card>

      {/* Garments & Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Garments & Measurements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.selectedGarments.length > 0 ? (
            <div className="space-y-4">
              {formData.selectedGarments.map((garment, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{garment.garmentType}</h4>
                      <p className="text-sm text-gray-600">Quantity: {garment.quantity}</p>
                    </div>
                  </div>
                  
                  {/* Garment Subtypes */}
                  {Object.keys(garment.subtypes).length > 0 && (
                    <div className="mb-3">
                      <h5 className="text-sm font-medium mb-2">Specifications:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(garment.subtypes).map(([category, value]) => (
                          <div key={category}>
                            <span className="text-gray-600 capitalize">{category.replace('_', ' ')}:</span>
                            <span className="ml-2 font-medium">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {garment.notes && (
                    <div className="text-sm">
                      <span className="text-gray-600">Notes:</span>
                      <span className="ml-2">{garment.notes}</span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Measurements Summary */}
              {Object.keys(formData.measurements).length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <Ruler className="w-4 h-4 mr-2" />
                    Measurements
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    {Object.entries(formData.measurements).map(([field, value]) => (
                      <div key={field}>
                        <span className="text-gray-600">{field}:</span>
                        <span className="ml-2 font-medium">{value}"</span>
                      </div>
                    ))}
                  </div>
                  {formData.saveMeasurements && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Measurements will be saved for future orders
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-red-600">No garments selected</p>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Amount:</span>
              <span className="text-lg font-bold">₹{formData.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Advance Paid:</span>
              <span className="text-lg font-semibold text-green-600">
                ₹{formData.advancePaid.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Pending Amount:</span>
              <span className={`text-lg font-semibold ${
                formData.pendingAmount > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                ₹{formData.pendingAmount.toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Payment Status:</span>
              <Badge className={getPaymentStatusColor(formData.paymentStatus)}>
                {formData.paymentStatus.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Payment Mode:</span>
              <span className="font-semibold capitalize">{formData.paymentMode}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Assignment & Delivery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Assigned Tailor:</span>
              <span className="font-semibold">
                {formData.tailorName || 'Not assigned'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Delivery Date:</span>
              <span className="font-semibold">
                {formData.deliveryDate ? new Date(formData.deliveryDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Priority:</span>
              <Badge className={getPriorityColor(formData.priority)}>
                {formData.priority.toUpperCase()}
              </Badge>
            </div>
            {formData.notes && (
              <div className="pt-2 border-t">
                <span className="font-medium">Special Instructions:</span>
                <p className="text-sm mt-1 text-gray-700">{formData.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-green-800">Ready to Create Order?</h3>
            <p className="text-green-700">
              Once you create this order, an invoice will be generated automatically and the tailor will be notified.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={onCreateOrder}
                className="bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Create Order & Generate Invoice
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 justify-center text-sm text-green-600">
              <span className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Auto-generate invoice
              </span>
              <span className="flex items-center">
                <Download className="w-4 h-4 mr-1" />
                Download PDF
              </span>
              <span className="flex items-center">
                <Printer className="w-4 h-4 mr-1" />
                Print ready
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Warnings */}
      {(!formData.customer || formData.selectedGarments.length === 0 || 
        formData.totalAmount === 0 || !formData.deliveryDate) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-red-800 mb-2">Please complete the following:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {!formData.customer && <li>• Select a customer</li>}
              {formData.selectedGarments.length === 0 && <li>• Add at least one garment</li>}
              {formData.totalAmount === 0 && <li>• Set the total amount</li>}
              {!formData.deliveryDate && <li>• Set a delivery date</li>}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}