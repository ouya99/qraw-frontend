import React, {useEffect, useState, forwardRef, useImperativeHandle} from 'react';

const InputMaxChars = forwardRef(({
                                    id,
                                    labelComponent,
                                    max,
                                    placeholder,
                                    initialValue = '',
                                    regEx = /.*/,
                                    onChange,
                                    externalError = '',
                                  },
                                  ref) => {
  const [value, setValue] = useState(initialValue);
  const [numChars, setNumChars] = useState(initialValue.length);
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false);


  const handleChange = (event) => {
    const newValue = event.target.value;

    if (regEx.test(newValue) && newValue.length <= max) {
      setError('');
      setNumChars(newValue.length);
      setValue(newValue);
      onChange(newValue);
    } else if (newValue.length > max) {
      setError(`Maximum ${max} characters allowed`);
    }
  };

  const handleBlur = () => {
    setTouched(true)
  }

  useEffect(() => {
    setValue(initialValue);
    setNumChars(initialValue.length);
  }, [initialValue]);

  useImperativeHandle(ref, () => ({
    validate: () => {
      if (value.length === 0) {
        setError('This field is required')
        return false
      } else if (value.length > max) {
        setError(`Maximum ${max} characters allowed`)
        return false
      } else {
        setError('')
        return true
      }
    }
  }));

  const displayError = externalError || error

  return (
    <div>
      {labelComponent}
      <input
        id={id}
        type="text"
        className="w-full p-4 bg-gray-80 text-white rounded-lg placeholder-gray-500 border-2 border-gray-70"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      <div className="text-right text-gray-500 text-sm mt-1">
        {displayError && (touched || externalError) && (
          <p className="text-red-500 text-left">{displayError}</p>
        )}
        {numChars}/{max}
      </div>
    </div>
  );
});

export default InputMaxChars;
