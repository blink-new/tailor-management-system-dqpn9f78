import { useState, useEffect } from 'react'
import { Plus, Minus, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { GarmentType } from '@/types'
import { blink } from '@/blink/client'

interface SelectedGarment {
  garmentType: string
  subtypes: Record<string, string>
  quantity: number
  notes?: string
}

interface GarmentSelectionStepProps {
  garmentTypes: GarmentType[]
  selectedGarments: SelectedGarment[]
  onGarmentsChange: (garments: SelectedGarment[]) => void
}

export function GarmentSelectionStep({
  garmentTypes,
  selectedGarments,
  onGarmentsChange
}: GarmentSelectionStepProps) {
  const [availableGarments, setAvailableGarments] = useState<string[]>([])
  const [garmentSubtypes, setGarmentSubtypes] = useState<Record<string, any>>({})

  const loadGarmentSubtypes = async () => {
    try {
      const subtypes = await blink.db.garmentSubtypes.list()
      const subtypesByGarment: Record<string, any> = {}
      
      // First get garment types to map IDs to names
      const garmentTypes = await blink.db.garmentTypes.list()
      const garmentTypeMap: Record<string, string> = {}
      garmentTypes.forEach(gt => {
        garmentTypeMap[gt.id] = gt.name
      })
      
      subtypes.forEach(subtype => {
        const garmentTypeName = garmentTypeMap[subtype.garmentTypeId]
        if (!garmentTypeName) return
        
        if (!subtypesByGarment[garmentTypeName]) {
          subtypesByGarment[garmentTypeName] = {}
        }
        if (!subtypesByGarment[garmentTypeName][subtype.category]) {
          subtypesByGarment[garmentTypeName][subtype.category] = []
        }
        
        // Parse options JSON string
        try {
          const options = JSON.parse(subtype.options)
          subtypesByGarment[garmentTypeName][subtype.category] = options
        } catch (e) {
          console.error('Error parsing subtype options:', e)
        }
      })
      
      setGarmentSubtypes(subtypesByGarment)
    } catch (error) {
      console.error('Error loading garment subtypes:', error)
    }
  }

  useEffect(() => {
    // Load available garment types
    const garmentNames = garmentTypes.map(gt => gt.name)
    setAvailableGarments(garmentNames)
    
    // Load garment subtypes
    loadGarmentSubtypes()
  }, [garmentTypes])

  const addGarment = (garmentType: string) => {
    const newGarment: SelectedGarment = {
      garmentType,
      subtypes: {},
      quantity: 1,
      notes: ''
    }
    onGarmentsChange([...selectedGarments, newGarment])
  }

  const removeGarment = (index: number) => {
    const updated = selectedGarments.filter((_, i) => i !== index)
    onGarmentsChange(updated)
  }

  const updateGarment = (index: number, updates: Partial<SelectedGarment>) => {
    const updated = selectedGarments.map((garment, i) => 
      i === index ? { ...garment, ...updates } : garment
    )
    onGarmentsChange(updated)
  }

  const updateSubtype = (garmentIndex: number, category: string, value: string) => {
    const updated = selectedGarments.map((garment, i) => 
      i === garmentIndex 
        ? { ...garment, subtypes: { ...garment.subtypes, [category]: value } }
        : garment
    )
    onGarmentsChange(updated)
  }

  const getAvailableSubtypes = (garmentType: string) => {
    return garmentSubtypes[garmentType] || {}
  }

  return (
    <div className="space-y-6">
      {/* Add Garment Section */}
      <div>
        <h3 className="font-medium mb-4">Select Garments</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {availableGarments.map((garmentType) => (
            <Button
              key={garmentType}
              variant="outline"
              className="h-auto p-4 flex flex-col items-center space-y-2"
              onClick={() => addGarment(garmentType)}
              disabled={selectedGarments.some(g => g.garmentType === garmentType)}
            >
              <Package className="w-6 h-6" />
              <span className="text-sm">{garmentType}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Garments */}
      {selectedGarments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Selected Garments ({selectedGarments.length})</h3>
          
          {selectedGarments.map((garment, index) => {
            const subtypes = getAvailableSubtypes(garment.garmentType)
            
            return (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>{garment.garmentType}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeGarment(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quantity */}
                  <div className="flex items-center space-x-4">
                    <Label className="w-20">Quantity:</Label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateGarment(index, { 
                          quantity: Math.max(1, garment.quantity - 1) 
                        })}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Input
                        type="number"
                        value={garment.quantity}
                        onChange={(e) => updateGarment(index, { 
                          quantity: Math.max(1, parseInt(e.target.value) || 1) 
                        })}
                        className="w-16 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateGarment(index, { 
                          quantity: garment.quantity + 1 
                        })}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Subtypes */}
                  {Object.keys(subtypes).length > 0 && (
                    <div className="space-y-3">
                      <Label className="font-medium">Garment Details:</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(subtypes).map(([category, options]) => (
                          <div key={category}>
                            <Label className="text-sm capitalize">
                              {category.replace('_', ' ')}:
                            </Label>
                            <Select
                              value={garment.subtypes[category] || ''}
                              onValueChange={(value) => updateSubtype(index, category, value)}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder={`Select ${category}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {(options as string[]).map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <Label className="text-sm">Additional Notes (Optional):</Label>
                    <Textarea
                      value={garment.notes || ''}
                      onChange={(e) => updateGarment(index, { notes: e.target.value })}
                      placeholder="Any special instructions for this garment..."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {selectedGarments.length === 0 && (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No garments selected</p>
          <p className="text-gray-400 text-sm mt-2">
            Select garments from the options above to continue
          </p>
        </div>
      )}
    </div>
  )
}