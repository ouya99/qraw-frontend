import React, {useState, forwardRef, useImperativeHandle} from 'react';

const InputNumbers = forwardRef(({id, labelComponent, placeholder, maxLimit = Infinity, onChange}, ref) => {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const newValue = e.target.value;

    const regEx = /^[0-9]*$/;

    if (regEx.test(newValue) && Number(newValue) <= maxLimit && Number(newValue) >= 0) {
      setValue(newValue);
      setError('');
      onChange(newValue);
    } else if (Number(newValue) > maxLimit) {
      setError(`Value must be less than or equal to ${maxLimit}`);
    } else {
      setError('Invalid input');
    }
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (value === '') {
        setError('This field is required');
        return false;
      }
      if (Number(value) > maxLimit) {
        setError(`Value must be less than or equal to ${maxLimit}`);
        return false;
      }
      setError('');
      return true;
    }
  }));

  return (
    <div>
      {labelComponent}
      <input
        id={id}
        type="text"  // change to "text" to prevent "e" input, while using regex for validation
        className={`w-full p-4 bg-gray-80 border border-gray-70 text-white rounded-lg placeholder-gray-500 ${error && 'border-red-500'}`}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
      />
      {error && <p className="text-red-500 text-right">{error}</p>}
    </div>
  );
});

export default InputNumbers;
