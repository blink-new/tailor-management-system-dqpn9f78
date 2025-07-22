import { useEffect } from 'react'
import { CreditCard, Calculator } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface PaymentDetailsStepProps {
  totalAmount: number
  advancePaid: number
  pendingAmount: number
  paymentMode: 'cash' | 'upi' | 'card' | 'other'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  onPaymentChange: (payment: {
    totalAmount?: number
    advancePaid?: number
    pendingAmount?: number
    paymentMode?: 'cash' | 'upi' | 'card' | 'other'
    paymentStatus?: 'unpaid' | 'partial' | 'paid'
  }) => void
}

export function PaymentDetailsStep({
  totalAmount,
  advancePaid,
  pendingAmount,
  paymentMode,
  paymentStatus,
  onPaymentChange
}: PaymentDetailsStepProps) {

  // Auto-calculate pending amount when total or advance changes
  useEffect(() => {
    const newPendingAmount = Math.max(0, totalAmount - advancePaid)
    if (newPendingAmount !== pendingAmount) {
      onPaymentChange({ pendingAmount: newPendingAmount })
    }
  }, [totalAmount, advancePaid, pendingAmount, onPaymentChange])

  // Auto-update payment status based on amounts
  useEffect(() => {
    let newStatus: 'unpaid' | 'partial' | 'paid'
    
    if (advancePaid === 0) {
      newStatus = 'unpaid'
    } else if (advancePaid >= totalAmount) {
      newStatus = 'paid'
    } else {
      newStatus = 'partial'
    }
    
    if (newStatus !== paymentStatus) {
      onPaymentChange({ paymentStatus: newStatus })
    }
  }, [totalAmount, advancePaid, paymentStatus, onPaymentChange])

  const handleTotalAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0
    onPaymentChange({ totalAmount: amount })
  }

  const handleAdvancePaidChange = (value: string) => {
    const amount = parseFloat(value) || 0
    const maxAdvance = totalAmount
    const finalAmount = Math.min(amount, maxAdvance)
    onPaymentChange({ advancePaid: finalAmount })
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'unpaid': return 'bg-red-100 text-red-800'
      case 'partial': return 'bg-orange-100 text-orange-800'
      case 'paid': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const quickAmountButtons = [500, 1000, 1500, 2000, 2500, 3000]

  return (
    <div className="space-y-6">
      {/* Total Amount */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Order Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="total-amount" className="text-sm font-medium">
              Total Order Amount (₹) *
            </Label>
            <Input
              id="total-amount"
              type="number"
              step="0.01"
              value={totalAmount || ''}
              onChange={(e) => handleTotalAmountChange(e.target.value)}
              placeholder="0.00"
              className="mt-1 text-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter the total amount for this order
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <Label className="text-sm font-medium">Quick Amount Selection:</Label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
              {quickAmountButtons.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => onPaymentChange({ totalAmount: amount })}
                  className="text-sm"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      {totalAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Advance Payment */}
            <div>
              <Label htmlFor="advance-paid" className="text-sm font-medium">
                Advance Payment (₹)
              </Label>
              <Input
                id="advance-paid"
                type="number"
                step="0.01"
                value={advancePaid || ''}
                onChange={(e) => handleAdvancePaidChange(e.target.value)}
                placeholder="0.00"
                max={totalAmount}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Amount paid in advance (max: ₹{totalAmount.toLocaleString()})
              </p>
            </div>

            {/* Payment Mode */}
            <div>
              <Label className="text-sm font-medium">Payment Mode</Label>
              <Select
                value={paymentMode}
                onValueChange={(value: 'cash' | 'upi' | 'card' | 'other') => 
                  onPaymentChange({ paymentMode: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select payment mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quick Advance Buttons */}
            <div>
              <Label className="text-sm font-medium">Quick Advance Selection:</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPaymentChange({ advancePaid: 0 })}
                  className="text-sm"
                >
                  ₹0
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPaymentChange({ advancePaid: totalAmount * 0.25 })}
                  className="text-sm"
                >
                  25%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPaymentChange({ advancePaid: totalAmount * 0.5 })}
                  className="text-sm"
                >
                  50%
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPaymentChange({ advancePaid: totalAmount })}
                  className="text-sm"
                >
                  Full
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Summary */}
      {totalAmount > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Order Amount:</span>
                <span className="text-lg font-bold">₹{totalAmount.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Advance Paid:</span>
                <span className="text-lg font-semibold text-green-600">
                  ₹{advancePaid.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Pending Amount:</span>
                <span className={`text-lg font-semibold ${
                  pendingAmount > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  ₹{pendingAmount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                <span className="font-medium">Payment Status:</span>
                <Badge className={getPaymentStatusColor(paymentStatus)}>
                  {paymentStatus.toUpperCase()}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-medium">Payment Mode:</span>
                <span className="font-semibold capitalize">{paymentMode}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Messages */}
      {totalAmount === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Please enter the total order amount to continue
            </p>
          </CardContent>
        </Card>
      )}

      {advancePaid > totalAmount && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800 text-sm">
              ❌ Advance payment cannot be more than the total amount
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}