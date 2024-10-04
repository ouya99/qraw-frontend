// utils/betApi.js
import {Buffer} from 'buffer';
import base64 from 'base-64';
import {HEADERS, makeJsonData, QTRY_CONTRACT_INDEX, QUERY_SMART_CONTRACT_API_URI, backendUrl} from './commons';

// Get Node's info using qubic-http's API
export const fetchNodeInfo = async () => {
  try {
    const jsonData = makeJsonData(QTRY_CONTRACT_INDEX, 1, 0, "");

    const response = await fetch(QUERY_SMART_CONTRACT_API_URI, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(jsonData),
    });

    // Check if the response is not ok (status is not 200-299)
    if (!response.ok) {
      throw new Error(`Error fetching node info: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    const data = base64.decode(responseData.responseData);
    const buffer = Buffer.from(data, 'binary');

    // Unpacking data using DataView
    const dataView = new DataView(buffer.buffer);

    const feePerSlotPerHour = dataView.getBigUint64(0, true);
    const gameOperatorFee = dataView.getBigUint64(8, true);
    const shareholderFee = dataView.getBigUint64(16, true);
    const minBetSlotAmount = dataView.getBigUint64(24, true);
    const burnFee = dataView.getBigUint64(32, true);
    const nIssuedBet = dataView.getUint32(40, true);
    // Skipping 4 bytes due to padding, so the next byte offset must be 48
    const moneyFlow = dataView.getBigUint64(48, true);
    const moneyFlowThroughIssueBet = dataView.getBigUint64(56, true);
    const moneyFlowThroughJoinBet = dataView.getBigUint64(64, true);
    const moneyFlowThroughFinalizeBet = dataView.getBigUint64(72, true);
    const earnedAmountForShareholder = dataView.getBigUint64(80, true);
    const paidAmountForShareholder = dataView.getBigUint64(88, true);
    const earnedAmountForBetWinner = dataView.getBigUint64(96, true);
    const distributedAmount = dataView.getBigUint64(104, true);
    const burnedAmount = dataView.getBigUint64(112, true);

    // This is Game operator public key, which is 32 bytes, converting it to Uint8Array
    // for later qubicHelper.getidentity() decoding.
    const gameOperatorBytes = new Uint8Array(buffer.slice(120, 152)); // 32 bytes

    // Returning the unpacked data
    return {
      fee_per_slot_per_hour: Number(feePerSlotPerHour),
      game_operator_fee: Number(gameOperatorFee),
      shareholder_fee: Number(shareholderFee),
      min_bet_slot_amount: Number(minBetSlotAmount),
      burn_fee: Number(burnFee),
      n_issued_bet: nIssuedBet,
      money_flow: Number(moneyFlow),
      money_flow_through_issue_bet: Number(moneyFlowThroughIssueBet),
      money_flow_through_join_bet: Number(moneyFlowThroughJoinBet),
      money_flow_through_finalize_bet: Number(moneyFlowThroughFinalizeBet),
      earned_amount_for_shareholder: Number(earnedAmountForShareholder),
      paid_amount_for_shareholder: Number(paidAmountForShareholder),
      earned_amount_for_bet_winner: Number(earnedAmountForBetWinner),
      distributed_amount: Number(distributedAmount),
      burned_amount: Number(burnedAmount),
      game_operator: gameOperatorBytes,
    };

  } catch (error) {
    console.error('Error in fetchNodeInfo:', error.message);
    console.log('Falling back to old API for node info.');

    // Fallback to old API
    try {
      const response = await fetch(`${backendUrl}/get_all_bets`);
      const data = await response.json();

      if (data.node_info) {
        return data.node_info[0];
      } else {
        throw new Error('Node info not found in old API response');
      }
    } catch (fallbackError) {
      console.error('Error fetching node info from old API:', fallbackError.message);
      throw fallbackError; // Re-throwing the error for handling later in the caller
    }
  }
};


// Fetch bets considered "active" by Quottery core (not reached end dates)
// In the frontend/UI, "active" bets haven't reached close dates,
// "locked" bets haven't reached end dates, and "inactive" bets have exceeded end dates.
// This function retrieves Quottery core active bet IDs using the qubic-http API.
export const fetchActiveBets = async () => {
  const json_data = makeJsonData(QTRY_CONTRACT_INDEX, 4, 0, '');

  const response = await fetch(QUERY_SMART_CONTRACT_API_URI, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(json_data),
  });


  const responseData = await response.json();
  const data = base64.decode(responseData.responseData);

  // Use Buffer to handle binary data
  const buffer = Buffer.from(data, 'binary');

  // Read the count of active bets (first 4 bytes as UInt32)
  const count = buffer.readUInt32LE(0);

  // Extract active bet IDs from the rest of the buffer
  const activeBetIds = [];
  for (let i = 0; i < count; i++) {
    activeBetIds.push(buffer.readUInt32LE(4 + i * 4));
  }

  return activeBetIds;
};


const parseFixedSizeStrings = (buffer, start, length, count, itemSize) => {
  // const items_ = [length];
  const items = [];
  for (let i = 0; i < count; i++) {
    const str = buffer.slice(start + i * itemSize, start + (i + 1) * itemSize).toString('utf-8');
    items.push(str.replace(/\0/g, '').trim()); // Remove null characters and trim whitespace
  }
  return items;
};

// Function to unpack Quottery date
const unpackQuotteryDate = (data) => {
  const year = ((data >> 26) & 0x3F) + 24;
  const month = (data >> 22) & 0x0F;
  const day = (data >> 17) & 0x1F;
  const hour = (data >> 12) & 0x1F;
  const minute = (data >> 6) & 0x3F;
  const second = data & 0x3F;

  return {year, month, day, hour, minute, second};
}

const calculateBettingOdds = (currentNumSelection) => {
  const totalSelections = currentNumSelection.reduce((acc, val) => acc + val, 0);

  // Initialize betting_odds as an array of "1.0"
  let betting_odds = Array(currentNumSelection.length).fill("1.0");

  if (totalSelections > 0) {
    betting_odds = currentNumSelection.map(selection =>
      selection > 0 ? (totalSelections / selection).toString() : totalSelections.toString()
    );
  }

  return betting_odds;
};

const formatQuotteryDate = (dateObj) => {
  if (!dateObj) return 'N/A';
  const year = dateObj.year.toString().padStart(2, '0');
  const month = dateObj.month.toString().padStart(2, '0');
  const day = dateObj.day.toString().padStart(2, '0');
  const hour = dateObj.hour.toString().padStart(2, '0');
  const minute = dateObj.minute.toString().padStart(2, '0');

  // Format the date and time similar to the old API structure
  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:00`
  };
};

const bufferToUint8Array = (buffer) => {
  return new Uint8Array(buffer);
};

// Function to fetch details of a specific bet given the bet id
export const fetchBetDetail = async (betId, maxRetryCount = 3) => {
  const betIdBuffer = Buffer.alloc(4);
  betIdBuffer.writeUInt32LE(betId, 0);
  const inputBase64 = base64.encode(betIdBuffer);

  const json_data = makeJsonData(QTRY_CONTRACT_INDEX, 2, 4, inputBase64);
  for (let attempt = 0; attempt < maxRetryCount; attempt++) {
    try {
      const response = await fetch(QUERY_SMART_CONTRACT_API_URI, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(json_data),
      });

      if (!response.ok) {
        throw new Error(`Error fetching bet details: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const data = base64.decode(responseData.responseData);
      const buffer = Buffer.from(data, 'binary');

      const nOption = buffer.readUInt32LE(4);
      const openDateRaw = unpackQuotteryDate(buffer.readUInt32LE(616));
      const closeDateRaw = unpackQuotteryDate(buffer.readUInt32LE(620));
      const endDateRaw = unpackQuotteryDate(buffer.readUInt32LE(624));

      const openDate = formatQuotteryDate(openDateRaw);
      const closeDate = formatQuotteryDate(closeDateRaw);
      const endDate = formatQuotteryDate(endDateRaw);

      const creator = bufferToUint8Array(buffer.slice(8, 40));

      const amountPerBetSlot = buffer.readBigUInt64LE(632); // Read uint64 minBetAmount

      // Parse and filter oracleProviderId to remove empty strings
      const oracleProviderId = parseFixedSizeStrings(buffer, 328, 256, 8, 32)
        .map(id => bufferToUint8Array(Buffer.from(id, 'utf-8')))
        .filter(id => id.length > 0); // Filter out empty strings

      const oracleFees = Array.from({ length: oracleProviderId.length }, (_, i) => buffer.readUInt32LE(584 + i * 4) / 100);
      const currentNumSelection = Array.from({ length: nOption }, (_, i) => buffer.readUInt32LE(644 + i * 4));

      const bettingOdds = calculateBettingOdds(currentNumSelection);

      // Calculate result based on oracle votes
      const betResultOPId = Array.from({ length: oracleProviderId.length }, (_, i) => buffer.readInt8(688 + i));

      let result = -1;
      if (oracleProviderId.length > 0) {
        const requiredVotes = Math.ceil(oracleProviderId.length * 2 / 3);
        const voteCount = new Map();
        let opVotedCount = 0;

        // Count votes
        betResultOPId.forEach(vote => {
          if (vote > -1) {
            voteCount.set(vote, (voteCount.get(vote) || 0) + 1);
            opVotedCount += 1;
          }
        });

        // Find the option with the maximum votes
        let maxVotes = 0;
        let keyWithMaxVotes = -1;
        for (const [key, count] of voteCount.entries()) {
          if (count > maxVotes) {
            maxVotes = count;
            keyWithMaxVotes = key;
          }
        }

        // Check if the dominated votes meet the required votes
        if (maxVotes >= requiredVotes) {
          result = keyWithMaxVotes;
        }
      }

      // Return unpacked bet details
      return {
        bet_id: buffer.readUInt32LE(0), // Read uint32 betId
        nOption: nOption, // Read uint32 nOption
        creator: creator,
        bet_desc: buffer.slice(40, 72).toString('utf-8').replace(/\0/g, '').trim(), // Read and clean 32-byte bet description
        option_desc: parseFixedSizeStrings(buffer, 72, 256, 8, 32).filter(id => id.length > 0), // Parse 8x 32-byte option descriptions
        oracle_id: oracleProviderId,
        oracle_fee: oracleFees,
        open_date: openDate.date,
        close_date: closeDate.date,
        end_date: endDate.date,
        open_time: openDate.time,
        close_time: closeDate.time,
        end_time: endDate.time,
        amount_per_bet_slot: amountPerBetSlot,
        maxBetSlotPerOption: buffer.readUInt32LE(640),
        current_bet_state: currentNumSelection,
        current_num_selection: currentNumSelection,
        betResultWonOption: Array.from({ length: oracleProviderId.length }, (_, i) => buffer.readInt8(680 + i)),
        betResultOPId: betResultOPId,
        current_total_qus: currentNumSelection.reduce((acc, val) => acc + val, 0) * Number(amountPerBetSlot),
        betting_odds: bettingOdds,
        result: result
      };

    } catch (error) {
      console.error(`Attempt ${attempt + 1}: Error fetching bet details for betId ${betId} - ${error.message}`);

      if (attempt === maxRetryCount - 1) {
        console.error('Max retry attempts reached. Failing gracefully.');
        throw error;  // Re-throw the error after the final attempt
      }

      console.log('Retrying...');
    }
  }
};
