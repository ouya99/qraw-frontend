import React, {useEffect, useState, forwardRef, useImperativeHandle} from 'react';
import InputMaxChars from './qubic/ui/InputMaxChars';
import InputRegEx from './qubic/ui/InputRegEx';
import LabelWithPopover from './qubic/ui/LabelWithPopover';

const ProvidersList = forwardRef(({max, providers: initialProviders, onChange}, ref) => {
  const [providers, setProviders] = useState(initialProviders);
  const [errors, setErrors] = useState({});
  const [totalFeeError, setTotalFeeError] = useState('')

  useEffect(() => {
    setProviders(initialProviders);
  }, [initialProviders]);

  const handleProviderChange = (index, field, value) => {
    const newProviders = [...providers]
    newProviders[index] = {...newProviders[index], [field]: value}
    setProviders(newProviders)
    onChange(newProviders)
  }

  const validateFees = (providerList) => {
    const totalFees = providerList.reduce((sum, provider) => {
      return sum + (parseFloat(provider.fee) || 0)
    }, 0)

    if (totalFees > 100) {
      setTotalFeeError('The total sum of provider fees cannot exceed 100%.')
      return false
    } else {
      setTotalFeeError('')
      return true
    }
  }

  const handleAddProvider = (event) => {
    event.preventDefault();
    if (providers.length < max) {
      const newProviders = [...providers, {publicId: '', fee: ''}];
      setProviders(newProviders);
      onChange(newProviders);
    }
  };

  const handleDeleteProvider = (index) => {
    const newProviders = providers.filter((_, i) => i !== index);
    setProviders([...newProviders]);
    onChange(newProviders);
    // validateProviders(newProviders)
    // validateFees(newProviders)
  };

  const validateProviders = (providerList) => {
    const newErrors = {}
    const uniqueIds = new Set()

    providerList.forEach((provider, index) => {
      if (!provider.publicId || !provider.publicId.trim()) {
        newErrors[`publicId_${index}`] = 'Oracle ID is required'
      } else if (uniqueIds.has(provider.publicId.trim())) {
        newErrors[`publicId_${index}`] = 'Oracle IDs must be unique'
      } else {
        uniqueIds.add(provider.publicId.trim())
      }

      if (!provider.fee || !provider.fee.trim()) {
        newErrors[`fee_${index}`] = 'Fee is required'
      }
    })
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  useImperativeHandle(ref, () => ({
    validate: () => {
      const isValidProviders = validateProviders(providers)
      const isValidFees = validateFees(providers)
      return isValidProviders && isValidFees
    },
  }))

  return (
    <div className="space-y-4">
      {providers.map((provider, index) => (
        <div key={index} className="flex flex-wrap items-start space-x-0 md:space-x-2">
          <div className="flex-grow w-full md:w-auto">
            <InputMaxChars
              id={`provider-publicId-${index}`}
              labelComponent={
                <LabelWithPopover
                  htmlFor={`provider-publicId-${index}`}
                  label={`Oracle ${index + 1} - ID`}
                  description="Enter the 60-character public ID of the Oracle Provider."
                />
              }
              max={60}
              placeholder="Enter Oracle ID"
              initialValue={provider.publicId}
              regEx={/^[A-Z]*$/}
              onChange={(value) => handleProviderChange(index, 'publicId', value)}
            />
            {errors[`publicId_${index}`] && <p className="text-red-500">{errors[`publicId_${index}`]}</p>}
          </div>
          <div className="w-full md:w-32">
            <InputRegEx
              id={`provider-fee-${index}`}
              labelComponent={
                <LabelWithPopover
                  htmlFor={`provider-fee-${index}`}
                  label={`Fee ${index + 1} %`}
                  description="Enter the fee percentage for this Oracle Provider."
                />
              }
              initialValue={provider.fee}
              onChange={(value) => handleProviderChange(index, 'fee', value)}
            />
            {errors[`fee_${index}`] && <p className="text-red-500">{errors[`fee_${index}`]}</p>}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleDeleteProvider(index);
            }}
            className="text-red-500 disabled:text-gray-500 mt-2 md:mt-0 md:ml-2"
            disabled={providers.length <= 1}
          >
            {/* Delete Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                 className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      ))}
      {providers.length < max && (
        <button
          onClick={handleAddProvider}
          className="bg-primary-40 text-black p-2 rounded-lg"
        >
          Add Provider
        </button>
      )}
      {totalFeeError && <p className="text-red-500">{totalFeeError}</p>}
    </div>
  );
});

export default ProvidersList;
