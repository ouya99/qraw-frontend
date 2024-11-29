import React from 'react'

function LoadingSpinner({ fullPage = false }) {
  return (
    <div className={`${fullPage ? 'fixed inset-0' : 'absolute inset-0'} flex items-center justify-center bg-black bg-opacity-50 z-50`}>
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-40"></div>
    </div>
  )
}

export default LoadingSpinner
