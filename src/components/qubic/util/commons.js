// src/components/qubic/commons.js

// export const QUERY_SMART_CONTRACT_API_URI = 'https://91.210.226.146/v1/querySmartContract'; // test system
export const QUERY_SMART_CONTRACT_API_URI = 'https://rpc.qubic.org/v1/querySmartContract'; // live system

export const HEADERS = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
};

export const QTRY_CONTRACT_INDEX = 2;
export const LOG_DEBUG = false
export const excludedBetIds = [31, 34, 58]
export const makeJsonData = (contractIndex, inputType, inputSize, requestData) => {
  return {
    contractIndex: contractIndex,
    inputType: inputType,
    inputSize: inputSize,
    requestData: requestData,
  };
};

// Compare between two Uint8Array
export const bytesEqual = (a, b) => {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export function formatDate(dateStr) {
  let [year, month, day] = dateStr.split('-')

  day = day.startsWith('0') ? day.slice(1) : day

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const getDaySuffix = (day) => {
    if (day > 3 && day < 21) return 'th' // 11th, 12th, 13th
    switch (day % 10) {
      case 1:  return 'st'
      case 2:  return 'nd'
      case 3:  return 'rd'
      default: return 'th'
    }
  }

  return `${day}${getDaySuffix(day)} ${monthNames[month - 1]} 20${year}`
}

export const debuglog = (...message) => {
  if (LOG_DEBUG) {
    console.log(...message)
  }
}

// export const backendUrl = 'https://qbtn.qubic.org' // test system
export const backendUrl = 'https://qb.qubic.org' // live system
export const externalJsonAssetUrl = 'https://qbtn.qubic.org' // test system
