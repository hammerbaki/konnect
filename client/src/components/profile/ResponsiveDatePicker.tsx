import React, { memo, useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
import { DateWheelPicker } from "@/components/ui/wheel-picker";
import { format } from "date-fns";
import { ResponsiveClose } from "./ResponsiveModal";

interface ResponsiveDatePickerContentProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  isEndDate?: boolean;
  hideButton?: boolean;
}

const ResponsiveDatePickerContentComponent: React.FC<ResponsiveDatePickerContentProps> = ({ 
  value, 
  onChange, 
  isEndDate = false,
  hideButton = false
}) => {
  const isMobile = useIsMobile();
  
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);

  useEffect(() => {
    if (value) {
      setYear(format(value, 'yyyy'));
      setMonth(format(value, 'M'));
      setDay(format(value, 'd'));
      setIsCurrent(false);
    } else if (isEndDate && value === null) {
      setIsCurrent(true);
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [value, isEndDate]); 

  const updateDate = useCallback((y: string, m: string, d: string) => {
    if (y.length === 4 && m.length > 0 && d.length > 0) {
      const yearNum = parseInt(y);
      const monthNum = parseInt(m) - 1;
      const dayNum = parseInt(d);
      
      const newDate = new Date(yearNum, monthNum, dayNum);
      const currentYear = new Date().getFullYear();
      
      if (yearNum > currentYear) return; 
      if (parseInt(m) > 12 || parseInt(m) < 1) return;
      
      const daysInMonth = new Date(yearNum, parseInt(m), 0).getDate();
      if (dayNum > daysInMonth || dayNum < 1) return;

      if (!isNaN(newDate.getTime()) && newDate.getMonth() === monthNum) {
        onChange(newDate);
      }
    }
  }, [onChange]);

  const handleYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    const currentYear = new Date().getFullYear();
    if (val.length === 4 && parseInt(val) > currentYear) {
      val = currentYear.toString();
    }
    setYear(val);
    updateDate(val, month, day);
  }, [month, day, updateDate]);

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setMonth(val);
    updateDate(year, val, day);
  }, [year, day, updateDate]);

  const handleDayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setDay(val);
    updateDate(year, month, val);
  }, [year, month, updateDate]);

  const handleCurrentChange = useCallback((checked: boolean) => {
    setIsCurrent(checked);
    if (checked) {
      onChange(null);
      setYear('');
      setMonth('');
      setDay('');
    }
  }, [onChange]);

  if (isMobile) {
    return (
      <div className="pb-4">
        {isEndDate && (
          <div className="flex items-center space-x-2 mb-4 px-4">
            <Checkbox 
              id="current-mobile" 
              checked={isCurrent}
              onCheckedChange={handleCurrentChange}
            />
            <label htmlFor="current-mobile" className="text-sm font-medium leading-none">
              현재 재직 중
            </label>
          </div>
        )}
        {!isCurrent && (
          <DateWheelPicker value={value || new Date()} onChange={onChange} />
        )}
        {!hideButton && (
          <ResponsiveClose asChild>
            <Button className="w-full mt-4 rounded-xl h-12 text-lg font-bold">완료</Button>
          </ResponsiveClose>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 w-full space-y-6">
      <div className="space-y-3 w-full">
        <div className="flex justify-between items-center">
          <Label className="text-[#4E5968] font-medium">날짜를 입력해주세요</Label>
          {isEndDate && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="current-desktop" 
                checked={isCurrent}
                onCheckedChange={handleCurrentChange}
              />
              <label htmlFor="current-desktop" className="text-sm font-medium leading-none cursor-pointer select-none">
                현재 재직 중
              </label>
            </div>
          )}
        </div>
        
        <div className={`flex items-center gap-2 transition-opacity ${isCurrent ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
          <div className="relative flex-1">
            <Input 
              value={year}
              onChange={handleYearChange}
              className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center"
              placeholder="YYYY"
              maxLength={4}
              disabled={isCurrent}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] text-sm font-medium">년</span>
          </div>
          <div className="relative w-[28%]">
            <Input 
              value={month}
              onChange={handleMonthChange}
              className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center"
              placeholder="MM"
              maxLength={2}
              disabled={isCurrent}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] text-sm font-medium">월</span>
          </div>
          <div className="relative w-[28%]">
            <Input 
              value={day}
              onChange={handleDayChange}
              className="h-14 text-xl font-medium rounded-xl border-[#E5E8EB] focus:border-[#3182F6] focus:ring-2 focus:ring-blue-100 transition-all text-center"
              placeholder="DD"
              maxLength={2}
              disabled={isCurrent}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B95A1] text-sm font-medium">일</span>
          </div>
        </div>
      </div>
      {!hideButton && (
        <ResponsiveClose asChild>
          <Button className="w-full rounded-xl h-12 text-lg font-bold bg-[#3182F6]">입력 완료</Button>
        </ResponsiveClose>
      )}
    </div>
  );
};

export const ResponsiveDatePickerContent = memo(ResponsiveDatePickerContentComponent);
