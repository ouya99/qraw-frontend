import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const SelectDateTime = forwardRef(({ labelComponent, fieldId, onChange, minDateTime }, ref) => {
  const [selectedDateTime, setSelectedDateTime] = useState(null)
  const [error, setError] = useState('')

  // Convert minDateTime to dayjs object in UTC
  const minDate = minDateTime
    ? dayjs.utc(`${minDateTime.date}T${minDateTime.time}Z`)
    : dayjs.utc()

  const handleDateChange = (newValue) => {
    if (newValue) {
      setSelectedDateTime(newValue)
      setError('')

      const utcDate = newValue.utc(true)
      const dateStr = utcDate.format('YYYY-MM-DD')
      const timeStr = utcDate.format('HH:mm')

      onChange({ date: dateStr, time: timeStr })
    } else {
      setSelectedDateTime(null)
      onChange({ date: '', time: '' })
    }
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (!selectedDateTime) {
        setError('Date and time are required.')
        return false
      }
      setError('')
      return true
    },
    reset: () => {
      setSelectedDateTime(null)
      setError('')
    },
  }))

  return (
    <div>
      {labelComponent}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateTimePicker
          label={null}
          value={selectedDateTime}
          onChange={handleDateChange}
          disablePast
          minDateTime={minDate}
          ampm={false}
          slotProps={{
            textField: {
              InputProps: {
                sx: {
                  backgroundColor: '#1F2937', // bg-gray-800
                  color: '#FFFFFF', // text-white
                  borderRadius: '0.5rem', // rounded-lg
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#374151', // border-gray-700
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#374151',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#374151',
                  },
                  '& .MuiSvgIcon-root': {
                    color: '#6B7280', // placeholder-gray-500 for the calendar icon
                  },
                },
                placeholder: 'Select date and time (UTC)',
              },
              inputProps: {
                style: {
                  color: '#FFFFFF', // text-white
                  padding: '16px', // p-4
                },
              },
              placeholder: 'Select date and time (UTC)',
            },
          }}
        />
      </LocalizationProvider>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
})

export default SelectDateTime
