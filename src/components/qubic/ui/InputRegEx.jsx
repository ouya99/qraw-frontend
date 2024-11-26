import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

const InputRegEx = forwardRef(
  (
    {
      id,
      labelComponent,
      initialValue = '',
      regEx = /^\d{0,2}(\.\d{0,2})?$/,
      placeholder = '00.00',
      onChange,
    },
    ref
  ) => {
    const [value, setValue] = useState(initialValue)
    const [error, setError] = useState('')

    const handleChange = (event) => {
      const newValue = event.target.value
      if (regEx.test(newValue) || newValue === '') {
        setValue(newValue)
        setError('')
        onChange(newValue)
      } else {
        setError('Invalid format')
      }
    }

    useEffect(() => {
      setValue(initialValue)
    }, [initialValue])

    useImperativeHandle(ref, () => ({
      validate: () => {
        if (!value) {
          setError('This field is required')
          return false
        } else {
          setError('')
          return true
        }
      },
    }))

    return (
      <div>
        {labelComponent}
        <input
          id={id}
          type="text"
          className={`w-full p-4 bg-gray-80 border border-gray-70 text-white rounded-lg placeholder-gray-500`}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
        {error && <p className="text-red-500">{error}</p>}
      </div>
    )
  }
)

export default InputRegEx
