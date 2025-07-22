import { useState, useEffect, useCallback } from 'react'
import { Ruler, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Customer } from '@/types'
import { blink } from '@/blink/client'

interface SelectedGarment {
  garmentType: string
  subtypes: Record<string, string>
  quantity: number
  notes?: string
}

interface MeasurementsStepProps {
  customer: Customer | null
  selectedGarments: SelectedGarment[]
  measurements: Record<string, number>
  saveMeasurements: boolean
  onMeasurementsChange: (measurements: Record<string, number>) => void
  onSaveMeasurementsChange: (save: boolean) => void
}

interface MeasurementField {
  name: string
  unit: string
  garmentType: string
}

interface PreviousMeasurement {
  id: string
  measurements: Record<string, number>
  garmentTypes: string[]
  createdAt: string
}

export function MeasurementsStep({
  customer,
  selectedGarments,
  measurements,
  saveMeasurements,
  onMeasurementsChange,
  onSaveMeasurementsChange
}: MeasurementsStepProps) {
  const [measurementFields, setMeasurementFields] = useState<MeasurementField[]>([])
  const [previousMeasurements, setPreviousMeasurements] = useState<PreviousMeasurement[]>([])
  const [selectedPreviousMeasurement, setSelectedPreviousMeasurement] = useState<string>('')

  const getDefaultMeasurementFields = (garmentType: string) => {
    const fieldsByGarment: Record<string, Array<{name: string, unit: string}>> = {
      'Shirt': [
        { name: 'Chest', unit: 'inches' },
        { name: 'Waist', unit: 'inches' },
        { name: 'Shoulder', unit: 'inches' },
        { name: 'Sleeve Length', unit: 'inches' },
        { name: 'Shirt Length', unit: 'inches' },
        { name: 'Neck', unit: 'inches' }
      ],
      'Pant': [
        { name: 'Waist', unit: 'inches' },
        { name: 'Hip', unit: 'inches' },
        { name: 'Length', unit: 'inches' },
        { name: 'Thigh', unit: 'inches' },
        { name: 'Knee', unit: 'inches' },
        { name: 'Bottom', unit: 'inches' }
      ],
      'Kurta': [
        { name: 'Chest', unit: 'inches' },
        { name: 'Waist', unit: 'inches' },
        { name: 'Shoulder', unit: 'inches' },
        { name: 'Sleeve Length', unit: 'inches' },
        { name: 'Kurta Length', unit: 'inches' },
        { name: 'Neck', unit: 'inches' }
      ],
      'Blazer': [
        { name: 'Chest', unit: 'inches' },
        { name: 'Waist', unit: 'inches' },
        { name: 'Shoulder', unit: 'inches' },
        { name: 'Sleeve Length', unit: 'inches' },
        { name: 'Blazer Length', unit: 'inches' },
        { name: 'Neck', unit: 'inches' }
      ]
    }
    
    return fieldsByGarment[garmentType] || []
  }

  const loadMeasurementFields = useCallback(async () => {
    try {
      // Get unique garment types from selected garments
      const garmentTypes = [...new Set(selectedGarments.map(g => g.garmentType))]
      
      // Load measurement fields for these garment types
      const fields: MeasurementField[] = []
      
      for (const garmentType of garmentTypes) {
        // Default measurement fields based on garment type
        const defaultFields = getDefaultMeasurementFields(garmentType)
        fields.push(...defaultFields.map(field => ({
          ...field,
          garmentType
        })))
      }
      
      setMeasurementFields(fields)
    } catch (error) {
      console.error('Error loading measurement fields:', error)
    }
  }, [selectedGarments])

  const loadPreviousMeasurements = useCallback(async () => {
    try {
      if (!customer) return
      
      const previousMeas = await blink.db.measurements.list({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        limit: 10
      })
      
      setPreviousMeasurements(previousMeas)
    } catch (error) {
      console.error('Error loading previous measurements:', error)
    }
  }, [customer])

  useEffect(() => {
    loadMeasurementFields()
    if (customer) {
      loadPreviousMeasurements()
    }
  }, [loadMeasurementFields, loadPreviousMeasurements, customer])

  const updateMeasurement = (fieldName: string, value: string) => {
    const numValue = parseFloat(value) || 0
    onMeasurementsChange({
      ...measurements,
      [fieldName]: numValue
    })
  }

  const usePreviousMeasurements = (measurementId: string) => {
    const prevMeas = previousMeasurements.find(m => m.id === measurementId)
    if (prevMeas) {
      onMeasurementsChange(prevMeas.measurements)
      setSelectedPreviousMeasurement(measurementId)
    }
  }

  const clearMeasurements = () => {
    onMeasurementsChange({})
    setSelectedPreviousMeasurement('')
  }

  // Group fields by garment type
  const fieldsByGarment = measurementFields.reduce((acc, field) => {
    if (!acc[field.garmentType]) {
      acc[field.garmentType] = []
    }
    acc[field.garmentType].push(field)
    return acc
  }, {} as Record<string, MeasurementField[]>)

  return (
    <div className="space-y-6">
      {/* Previous Measurements */}
      {customer && previousMeasurements.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <History className="w-5 h-5 mr-2" />
              Previous Measurements Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-blue-700">
                Found {previousMeasurements.length} previous measurement sets for {customer.name}
              </p>
              <div className="flex items-center space-x-4">
                <Select
                  value={selectedPreviousMeasurement}
                  onValueChange={usePreviousMeasurements}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select previous measurements" />
                  </SelectTrigger>
                  <SelectContent>
                    {previousMeasurements.map((meas) => (
                      <SelectItem key={meas.id} value={meas.id}>
                        {new Date(meas.createdAt).toLocaleDateString()} - {meas.garmentTypes.join(', ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={clearMeasurements}>
                  Clear & Enter New
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Measurement Fields */}
      {Object.keys(fieldsByGarment).length === 0 ? (
        <div className="text-center py-8">
          <Ruler className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No garments selected</p>
          <p className="text-gray-400 text-sm mt-2">
            Please select garments in the previous step to see measurement fields
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(fieldsByGarment).map(([garmentType, fields]) => (
            <Card key={garmentType}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Ruler className="w-5 h-5 mr-2" />
                  {garmentType} Measurements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fields.map((field) => (
                    <div key={field.name}>
                      <Label className="text-sm font-medium">
                        {field.name} ({field.unit})
                      </Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={measurements[field.name] || ''}
                        onChange={(e) => updateMeasurement(field.name, e.target.value)}
                        placeholder="0.0"
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Save Measurements Option */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="save-measurements"
                  checked={saveMeasurements}
                  onCheckedChange={(checked) => onSaveMeasurementsChange(checked as boolean)}
                />
                <Label htmlFor="save-measurements" className="text-green-800 font-medium">
                  Save these measurements for future orders
                </Label>
              </div>
              <p className="text-sm text-green-600 mt-2 ml-6">
                This will allow you to quickly reuse these measurements for future orders for this customer
              </p>
            </CardContent>
          </Card>

          {/* Measurement Summary */}
          {Object.keys(measurements).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Measurement Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(measurements).map(([field, value]) => (
                    <div key={field} className="text-sm">
                      <span className="font-medium">{field}:</span> {value}"
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}