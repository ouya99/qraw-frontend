import { Buffer } from 'buffer';

import base64 from 'base-64';

import { encodeParams, decodeContractResponse } from './contractUtils';

export const HEADERS = {
  accept: 'application/json',
  'Content-Type': 'application/json',
};

/**
 * Creates a formatted request payload for contract interactions
 * @param {number} contractIndex - The index of the contract
 * @param {number} inputType - Function or procedure index
 * @param {number} inputSize - Size of the input data
 * @param {string} requestData - Base64 encoded input data
 * @returns {Object} Formatted request payload
 */
export const makeJsonData = (contractIndex, functionIndex, inputSize, requestData) => ({
  contractIndex,
  inputType: functionIndex,
  inputSize,
  requestData,
});

/**
 * Execute a view function (query) on a contract
 * @param {string} httpEndpoint - API endpoint URL
 * @param {number|string} contractIndex - Contract index or name
 * @param {number} functionIndex - Function index
 * @param {Object} params - Function parameters
 * @param {Array} inputFields - Input field definitions
 * @param {Object} selectedFunction - Complete function definition
 * @param {Object} customIndexes - Custom indexes for contract
 * @param {Object} qHelper - QubicHelper instance for encoding IDs
 * @returns {Promise<Object>} Query result
 */
export async function queryContract(
  httpEndpoint,
  contractIndex,
  functionIndex,
  params = {},
  inputFields = [],
  selectedFunction = null,
  customIndexes = null,
  qHelper = null,
) {
  console.log(`Query contract called with: ${contractIndex}, function: ${functionIndex}`);

  let contractIdxNum = contractIndex;

  if (typeof contractIndex === 'string') {
    contractIdxNum = 15; // QMIX - QDRAW 15 hardcoded- getContractIndex(contractIndex, customIndexes);
  }

  const encodedData = encodeParams(params, inputFields, qHelper);
  const inputSize = encodedData ? Buffer.from(base64.decode(encodedData), 'binary').length : 0;
  const queryData = makeJsonData(contractIdxNum, functionIndex, inputSize, encodedData);

  try {
    let endpoint = httpEndpoint;
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = 'https://' + endpoint;
    }

    let url = `${endpoint}/v1/querySmartContract`;
    if (process.env.NODE_ENV === 'development' && endpoint.includes('rpc.qubic.org')) {
      // Only use proxy for mainnet endpoint to avoid CORS
      url = `/api/proxy/v1/querySmartContract`;
    }

    console.log('[contractApi] Making request to URL:', url);
    console.log('[contractApi] Request payload:', JSON.stringify(queryData, null, 2));

    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(queryData),
    });

    console.log('[contractApi] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const json = await response.json();
    console.log('[contractApi] Raw JSON response:', JSON.stringify(json, null, 2));

    // Check if responseData exists and log its details
    if (json.responseData) {
      console.log('[contractApi] ResponseData exists, length:', json.responseData.length);
      console.log('[contractApi] ResponseData preview:', json.responseData.substring(0, 100));
    } else {
      console.log('[contractApi] ResponseData is missing or empty!');
      console.log('[contractApi] Full response keys:', Object.keys(json));

      // If proxy returns empty data, try direct call as fallback
      if (process.env.NODE_ENV === 'development' && endpoint.includes('rpc.qubic.org')) {
        console.log('[contractApi] Proxy returned empty data, trying direct call...');

        const directUrl = `${endpoint}/v1/querySmartContract`;
        console.log('[contractApi] Trying direct URL:', directUrl);

        try {
          const directResponse = await fetch(directUrl, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(queryData),
          });

          if (directResponse.ok) {
            const directJson = await directResponse.json();
            console.log('[contractApi] Direct call response:', JSON.stringify(directJson, null, 2));

            if (directJson.responseData) {
              console.log('[contractApi] Direct call has responseData! Using it.');
              return {
                ...decodeContractResponse(directJson.responseData, selectedFunction?.outputs || []),
                rawResponse: directJson,
              };
            }
          }
        } catch (directError) {
          console.log('[contractApi] Direct call also failed:', directError.message);
        }
      }
    }

    const decodedResponse = decodeContractResponse(
      json.responseData,
      selectedFunction?.outputs || [],
    );

    console.log('[contractApi] Decoded response:', decodedResponse);

    return {
      ...decodedResponse,
      rawResponse: json,
    };
  } catch (error) {
    console.error('Error querying contract:', error);
    let errorDetails = error.message;

    if (error.message.includes('Failed to fetch')) {
      errorDetails = `Network error: Unable to reach ${httpEndpoint}. This could be due to CORS restrictions, network connectivity, or the server being unavailable. Try using a CORS proxy or backend API.`;
    }

    return {
      success: false,
      error: errorDetails,
    };
  }
}

/**
 * Execute a transaction (procedure) on a contract
 * @param {string} httpEndpoint - API endpoint URL
 * @param {number} contractIndex - Contract index
 * @param {number} procedureIndex - Procedure index
 * @param {Object} params - Procedure parameters
 * @returns {Promise<Object>} Transaction result
 */
export async function executeTransaction(httpEndpoint, contractIndex, procedureIndex, params = {}) {
  // Convert params to appropriate binary format and encode as base64
  const encodedData = encodeParams(params);
  const inputSize = encodedData ? Buffer.from(base64.decode(encodedData), 'binary').length : 0;

  const txData = makeJsonData(contractIndex, procedureIndex, inputSize, encodedData);

  try {
    console.log('Sending transaction data:', txData);

    // If endpoint doesn't have http/https prefix, add it
    let endpoint = httpEndpoint;
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      endpoint = 'https://' + endpoint;
    }

    // Check if we should use a proxy to avoid CORS issues
    let url = `${endpoint}/v1/submitTransaction`;
    let corsOptions = {};

    // If we're in development, use the local proxy to avoid CORS issues
    if (process.env.NODE_ENV === 'development' && endpoint.includes('rpc.qubic.org')) {
      // Only use proxy for mainnet endpoint to avoid CORS
      url = `/api/proxy/v1/submitTransaction`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(txData),
      ...corsOptions,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${await response.text()}`);
    }

    const json = await response.json();
    console.log('Transaction response:', json);

    return {
      success: true,
      txHash: json.txHash,
      ...json,
    };
  } catch (error) {
    console.error('Error executing transaction:', error);

    // Provide more info about the error
    let errorDetails = error.message;

    // Check for common network errors
    if (error.message.includes('Failed to fetch')) {
      errorDetails = `Network error: Unable to reach ${httpEndpoint}. This could be due to CORS restrictions, network connectivity, or the server being unavailable. Try using a CORS proxy or backend API.`;
    }

    return {
      success: false,
      error: errorDetails,
    };
  }
}
