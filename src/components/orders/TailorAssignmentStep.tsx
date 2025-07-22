import { UserCheck, Calendar, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Worker } from '@/types'

interface TailorAssignmentStepProps {
  workers: Worker[]
  tailorId?: string
  deliveryDate: string
  priority: 'low' | 'medium' | 'high'
  notes?: string
  onAssignmentChange: (assignment: {
    tailorId?: string
    tailorName?: string
    deliveryDate?: string
    priority?: 'low' | 'medium' | 'high'
    notes?: string
  }) => void
}

export function TailorAssignmentStep({
  workers,
  tailorId,
  deliveryDate,
  priority,
  notes,
  onAssignmentChange
}: TailorAssignmentStepProps) {

  const handleTailorSelect = (selectedTailorId: string) => {
    const selectedTailor = workers.find(w => w.id === selectedTailorId)
    onAssignmentChange({
      tailorId: selectedTailorId,
      tailorName: selectedTailor?.name
    })
  }

  const handleDeliveryDateChange = (date: string) => {
    onAssignmentChange({ deliveryDate: date })
  }

  const handlePriorityChange = (newPriority: 'low' | 'medium' | 'high') => {
    onAssignmentChange({ priority: newPriority })
  }

  const handleNotesChange = (newNotes: string) => {
    onAssignmentChange({ notes: newNotes })
  }

  const getPriorityColor = (priorityLevel: string) => {
    switch (priorityLevel) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getQuickDeliveryDate = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const isDateInPast = (date: string) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate < today
  }

  const selectedTailor = workers.find(w => w.id === tailorId)

  return (
    <div className="space-y-6">
      {/* Tailor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserCheck className="w-5 h-5 mr-2" />
            Assign Tailor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workers.length === 0 ? (
            <div className="text-center py-6">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tailors available</p>
              <p className="text-gray-400 text-sm mt-2">
                Add tailors in the Workers section to assign orders
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-sm font-medium">Select Tailor</Label>
                <Select
                  value={tailorId || ''}
                  onValueChange={handleTailorSelect}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a tailor for this order" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((worker) => (
                      <SelectItem key={worker.id} value={worker.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{worker.name}</span>
                          <div className="flex items-center space-x-2 ml-4">
                            <Badge variant="secondary" className="text-xs">
                              {worker.assignedOrders} assigned
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {worker.completedOrders} completed
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Tailor Info */}
              {selectedTailor && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-green-800">{selectedTailor.name}</h4>
                        <p className="text-sm text-green-600">{selectedTailor.mobile}</p>
                        <p className="text-sm text-green-600">
                          Skills: {selectedTailor.skills.join(', ')}
                        </p>
                      </div>
                      <div className="text-right text-sm text-green-700">
                        <p>Assigned: {selectedTailor.assignedOrders}</p>
                        <p>Completed: {selectedTailor.completedOrders}</p>
                        <p>Rate: ₹{selectedTailor.wageAmount}/{selectedTailor.wageType.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delivery Date */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Delivery Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="delivery-date" className="text-sm font-medium">
              Delivery Date *
            </Label>
            <Input
              id="delivery-date"
              type="date"
              value={deliveryDate}
              onChange={(e) => handleDeliveryDateChange(e.target.value)}
              className="mt-1"
              min={new Date().toISOString().split('T')[0]}
            />
            {deliveryDate && isDateInPast(deliveryDate) && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Warning: Selected date is in the past
              </p>
            )}
          </div>

          {/* Quick Date Selection */}
          <div>
            <Label className="text-sm font-medium">Quick Date Selection:</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeliveryDateChange(getQuickDeliveryDate(3))}
                className="text-sm"
              >
                3 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeliveryDateChange(getQuickDeliveryDate(7))}
                className="text-sm"
              >
                1 Week
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeliveryDateChange(getQuickDeliveryDate(14))}
                className="text-sm"
              >
                2 Weeks
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeliveryDateChange(getQuickDeliveryDate(30))}
                className="text-sm"
              >
                1 Month
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Priority and Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Order Priority & Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority Selection */}
          <div>
            <Label className="text-sm font-medium">Order Priority</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Button
                variant={priority === 'low' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityChange('low')}
                className={priority === 'low' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Low Priority
              </Button>
              <Button
                variant={priority === 'medium' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityChange('medium')}
                className={priority === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                Medium Priority
              </Button>
              <Button
                variant={priority === 'high' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePriorityChange('high')}
                className={priority === 'high' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                High Priority
              </Button>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <Label htmlFor="order-notes" className="text-sm font-medium">
              Special Instructions (Optional)
            </Label>
            <Textarea
              id="order-notes"
              value={notes || ''}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Any special instructions for the tailor..."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Assignment Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Assignment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Assigned Tailor:</span>
              <span className="font-semibold">
                {selectedTailor ? selectedTailor.name : 'Not assigned'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Delivery Date:</span>
              <span className="font-semibold">
                {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Priority Level:</span>
              <Badge className={getPriorityColor(priority)}>
                {priority.toUpperCase()}
              </Badge>
            </div>
            
            {notes && (
              <div className="pt-2 border-t border-blue-200">
                <span className="font-medium">Special Instructions:</span>
                <p className="text-sm mt-1 text-blue-700">{notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {!deliveryDate && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please set a delivery date to continue
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}