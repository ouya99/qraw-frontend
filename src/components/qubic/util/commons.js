// src/components/qubic/commons.js

export const QUERY_SMART_CONTRACT_API_URI = 'https://rpc.qubic.org/v1/querySmartContract';

export const HEADERS = {
  'accept': 'application/json',
  'Content-Type': 'application/json',
};

export const QTRY_CONTRACT_INDEX = 2;
export const excludedBetIds = []
export const makeJsonData = (contractIndex, inputType, inputSize, requestData) => {
  return {
    contractIndex: contractIndex,
    inputType: inputType,
    inputSize: inputSize,
    requestData: requestData,
  };
};

export const backendUrl = 'https://qbtn.qubic.org' // test system
// const backendUrl = 'https://qb.qubic.org' // live system
