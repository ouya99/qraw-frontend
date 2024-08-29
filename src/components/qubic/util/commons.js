// src/components/qubic/commons.js

export const QUERY_SMART_CONTRACT_API_URI = 'https://testapi.qubic.org/v1/querySmartContract';

export const HEADERS = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
};

export const QTRY_CONTRACT_INDEX = 2;

export const makeJsonData = (contractIndex, inputType, inputSize, requestData) => {
  return {
    contractIndex: contractIndex,
    inputType: inputType,
    inputSize: inputSize,
    requestData: requestData,
  };
};
