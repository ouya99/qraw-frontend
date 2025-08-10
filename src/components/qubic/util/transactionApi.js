/* global BigInt */

import { Buffer } from 'buffer';
import base64 from 'base-64';
import { encodeParams, byteArrayToHexString } from './contractUtils';

// Tick offset for future execution
const TICK_OFFSET = 10;

/**
 * Execute a transaction (procedure) on a contract using wallet integration.
 * This function now takes the full context object provided by App.js
 * and uses the requestConfirmation flow.
 */
export async function executeTransactionWithWallet({
  qubicConnect, // Contains wallet, qHelper, getTick, signTransaction, broadcastTx, httpEndpoint
  contractIndex, // Can be name or number
  procedureIndex,
  params = {}, // User-provided parameters from the form
  inputFields = [], // Input field definitions for encoding
  // Added details passed from App.js for confirmation display
  amount,
  sourceId,
  destinationId,
  contractIndexes, // Add this parameter
}) {
  console.log('params', params);
  // Destructure needed functions/state from context
  const {
    wallet,
    qHelper,
    getTick,
    signTransaction,
    broadcastTx,
    httpEndpoint,
  } = qubicConnect;

  if (!wallet || !wallet.publicKey) {
    throw new Error('Wallet not connected or public key unavailable.');
  }
  if (!qHelper) {
    throw new Error(
      'QubicHelper instance (qHelper) is not available in the context.'
    );
  }

  // Note: No `try...catch` here, errors will be caught by the calling function in App.js
  // after the confirmation promise is rejected or resolves with an error.

  // --- 1. Prepare Transaction Data ---

  // Get current tick from network
  const tick = await getTick();
  if (tick === null || tick === undefined) {
    throw new Error('Failed to retrieve current network tick.');
  }
  const finalTick = tick + TICK_OFFSET;

  // Convert contract name to index if needed
  let contractIdxNum = 15;

  // Get source public key bytes (already validated that wallet exists)
  let sourcePublicKeyBytes;
  try {
    sourcePublicKeyBytes = qHelper.getIdentityBytes(wallet.publicKey);
  } catch (error) {
    console.error('Error getting source public key bytes:', error);
    throw new Error(
      `Failed to convert source public key ${wallet.publicKey} to bytes.`
    );
  }
  if (
    !sourcePublicKeyBytes ||
    sourcePublicKeyBytes.length !== qHelper.PUBLIC_KEY_LENGTH
  ) {
    throw new Error('Failed to get valid source public key bytes.');
  }

  // Amount (use the value passed for confirmation, default to 0)
  const transactionAmount = BigInt(amount || 0);

  // Encode parameters (make sure transactionAmount isn't included here if it was a form field)
  const paramsToEncode = { ...params };
  if (paramsToEncode.transactionAmount) {
    // console.log("Removing transactionAmount from encoded params");
    delete paramsToEncode.transactionAmount;
  }
  const encodedData = encodeParams(paramsToEncode, inputFields, qHelper);
  const inputBytes = encodedData
    ? new Uint8Array(Buffer.from(base64.decode(encodedData), 'binary'))
    : new Uint8Array(0);
  const inputSize = inputBytes.length;
  const inputDataHex = encodedData ? byteArrayToHexString(inputBytes) : null;

  // --- 2. Build Unsigned Transaction ---

  const TX_SIZE = qHelper.TRANSACTION_SIZE + inputSize;
  const tx = new Uint8Array(TX_SIZE).fill(0);
  const dv = new DataView(tx.buffer);
  let offset = 0;

  // Source Public Key (32 bytes)
  tx.set(sourcePublicKeyBytes, offset);
  offset += qHelper.PUBLIC_KEY_LENGTH;

  // Destination Public Key (32 bytes) - Set first byte to contract index
  // Important: The remaining 31 bytes should be 0 for contract calls
  tx[offset] = contractIdxNum;
  // No need to zero out rest due to .fill(0) on initialization
  offset += qHelper.PUBLIC_KEY_LENGTH;

  // Amount (8 bytes)
  dv.setBigInt64(offset, transactionAmount, true); // Use LE (true)
  offset += 8;

  // Tick (4 bytes)
  dv.setUint32(offset, finalTick, true); // Use LE (true)
  offset += 4;

  // Input Type / Procedure Index (2 bytes)
  dv.setUint16(offset, procedureIndex, true); // Use LE (true)
  offset += 2;

  // Input Size (2 bytes)
  dv.setUint16(offset, inputSize, true); // Use LE (true)
  offset += 2;

  // Input Data (variable bytes)
  if (inputSize > 0) {
    tx.set(inputBytes, offset);
    offset += inputSize;
  }

  // The remaining bytes (offset to TX_SIZE) are reserved for the signature
  // and are already initialized to 0.

  console.log(
    'Unsigned Tx built (Hex):',
    byteArrayToHexString(tx.slice(0, offset))
  );
  console.log(
    `Expected Signature Offset: ${offset}, Expected TX Size: ${TX_SIZE}`
  );

  // --- 3. Sign Transaction ---
  // The signTransaction function is provided by the context and handles different wallet types.
  console.log('Requesting signature via context...');
  const signedTx = await signTransaction(tx); // Pass the full tx buffer
  if (!signedTx || signedTx.length !== TX_SIZE) {
    throw new Error('Signing failed or returned invalid transaction data.');
  }
  console.log('Transaction signed (Full Hex):', byteArrayToHexString(signedTx));

  // --- 4. Broadcast Transaction ---
  console.log('Broadcasting signed transaction...');
  const broadcastResult = await broadcastTx(signedTx);
  if (!broadcastResult) {
    // broadcastTx in context should throw on network error
    throw new Error('Broadcasting failed. No result returned.');
  }

  console.log('Broadcast API Result:', broadcastResult);

  // --- 5. Format and Return Result ---
  const txHash = broadcastResult.txHash || broadcastResult.transactionId; // Check both possible fields

  // Determine Explorer URL based on RPC endpoint
  const isTestnet =
    httpEndpoint && httpEndpoint.toLowerCase().includes('testnet');
  const baseExplorerUrl = isTestnet
    ? 'https://testnet.explorer.qubic.org'
    : 'https://explorer.qubic.org';

  let explorerLink = null;
  if (txHash) {
    explorerLink = `${baseExplorerUrl}/network/tx/${txHash}?type=latest`;
  } else {
    explorerLink = `${baseExplorerUrl}/network/address/${wallet.publicKey}`;
    console.warn('Transaction hash not found in broadcast response.');
  }

  return {
    success: true, // Assume success if broadcast didn't throw
    txHash: txHash || 'N/A', // Provide hash or indicate absence
    message:
      'Transaction broadcast successfully.' +
      (!txHash ? ' (Hash pending confirmation)' : ''),
    explorerLink,
    ...broadcastResult, // Include any other fields from the broadcast response
  };
}
