import React, { useEffect, useState, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { EmblaCarouselType } from 'embla-carousel'
import { cn } from '@/lib/utils'

interface WheelPickerProps {
  items: string[]
  value: string
  onChange: (value: string) => void
  label?: string
  loop?: boolean
}

export function WheelPicker({ items, value, onChange, label, loop = false }: WheelPickerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    axis: 'y',
    dragFree: true,
    loop,
    containScroll: false,
    watchSlides: false // Performance optimization
  })
  
  const [selectedIndex, setSelectedIndex] = useState(items.indexOf(value))
  const isScrolling = useRef(false)

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    const index = emblaApi.selectedScrollSnap()
    setSelectedIndex(index)
    if (!isScrolling.current) {
        onChange(items[index])
    }
  }, [items, onChange])

  useEffect(() => {
    if (!emblaApi) return
    
    const handleScroll = () => { isScrolling.current = true }
    const handleSettle = () => { 
      isScrolling.current = false 
      const index = emblaApi.selectedScrollSnap()
      const newValue = items[index]
      if (newValue !== value) {
        onChange(newValue)
      }
    }
    
    emblaApi.on('select', onSelect)
    emblaApi.on('scroll', handleScroll)
    emblaApi.on('settle', handleSettle)
    
    // Initial scroll - only if value changed and differs from current selection
    const initialIndex = items.indexOf(value)
    const currentIndex = emblaApi.selectedScrollSnap()
    if (initialIndex !== -1 && initialIndex !== currentIndex) {
      emblaApi.scrollTo(initialIndex, true)
    }
    
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('scroll', handleScroll)
      emblaApi.off('settle', handleSettle)
    }
  }, [emblaApi, onSelect, value, items, onChange])

  return (
    <div className="relative flex flex-col items-center justify-center h-48 w-full overflow-hidden cursor-grab active:cursor-grabbing touch-pan-y select-none">
      {label && <div className="absolute top-0 left-0 w-full text-center text-xs font-bold text-gray-400 z-10 pointer-events-none">{label}</div>}
      
      {/* Selection Highlight Overlay */}
      <div className="absolute h-10 w-full border-y border-blue-500/20 bg-blue-50/30 z-0 pointer-events-none" />

      <div className="h-full w-full" ref={emblaRef}>
        <div className="h-full flex flex-col items-center py-[calc(50%-20px)]"> 
          {/* Padding top/bottom to center the first/last item. 
              Container height is 192px (h-48). Item height is 40px (h-10).
              (192 - 40) / 2 = 76px padding.
          */}
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center justify-center h-10 w-full transition-all duration-200 text-lg",
                index === selectedIndex 
                  ? "text-[#191F28] font-bold scale-110" 
                  : "text-[#B0B8C1] font-medium scale-90 opacity-50"
              )}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface DateWheelPickerProps {
    value?: Date
    onChange: (date: Date) => void
}

export function DateWheelPicker({ value = new Date(), onChange }: DateWheelPickerProps) {
    const years = Array.from({ length: 50 }, (_, i) => (new Date().getFullYear() - 40 + i).toString())
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
    // Simple days (28-31 logic can be added, but keeping simple 1-31 for now)
    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))

    const [selectedYear, setSelectedYear] = useState(value.getFullYear().toString())
    const [selectedMonth, setSelectedMonth] = useState((value.getMonth() + 1).toString().padStart(2, '0'))
    const [selectedDay, setSelectedDay] = useState(value.getDate().toString().padStart(2, '0'))

    useEffect(() => {
        const date = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, parseInt(selectedDay))
        onChange(date)
    }, [selectedYear, selectedMonth, selectedDay])

    return (
        <div className="flex gap-2 w-full justify-center px-8">
            <div className="flex-1">
                <WheelPicker items={years} value={selectedYear} onChange={setSelectedYear} label="년" />
            </div>
            <div className="flex-1">
                <WheelPicker items={months} value={selectedMonth} onChange={setSelectedMonth} label="월" loop={true} />
            </div>
            <div className="flex-1">
                <WheelPicker items={days} value={selectedDay} onChange={setSelectedDay} label="일" loop={true} />
            </div>
        </div>
    )
}

interface SalaryWheelPickerProps {
    value: number // e.g. 6000 (Unit: Man-won)
    onChange: (val: number) => void
}

export function SalaryWheelPicker({ value, onChange }: SalaryWheelPickerProps) {
    // 4 digits: Thousands, Hundreds, Tens, Units (Actually for salary like 6000, 
    // usually it's input as "6,0,0,0" but user said "4 digits".
    // If salary is 6000 (6천만원), maybe they want to scroll [0-9] [0-9] [0-9] [0-9] ? 
    // Or maybe ranges? 
    // "4 digits can be scrolled up and down like a vault digits"
    // Let's assume they want to set 4 digits representing xxxx 만원. 
    
    const digitStr = value.toString().padStart(4, '0')
    const digits = digitStr.split('')
    const numberRange = ['0','1','2','3','4','5','6','7','8','9']

    const updateDigit = (index: number, newVal: string) => {
        const newDigits = [...digits]
        newDigits[index] = newVal
        onChange(parseInt(newDigits.join('')))
    }

    return (
        <div className="flex gap-1 w-full justify-center px-12 items-center">
            <WheelPicker items={numberRange} value={digits[0]} onChange={(v) => updateDigit(0, v)} loop={true} />
            <WheelPicker items={numberRange} value={digits[1]} onChange={(v) => updateDigit(1, v)} loop={true} />
            <WheelPicker items={numberRange} value={digits[2]} onChange={(v) => updateDigit(2, v)} loop={true} />
            <WheelPicker items={numberRange} value={digits[3]} onChange={(v) => updateDigit(3, v)} loop={true} />
            <span className="text-lg font-bold text-[#191F28] ml-2">만원</span>
        </div>
    )
}
