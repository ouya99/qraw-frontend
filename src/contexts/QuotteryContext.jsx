/* global BigInt */
import React, {createContext, useContext, useEffect, useReducer, useState} from 'react'
import {QubicHelper} from '@qubic-lib/qubic-ts-library/dist/qubicHelper'
import Crypto from '@qubic-lib/qubic-ts-library/dist/crypto'
import {useQubicConnect} from '../components/qubic/connect/QubicConnectContext'
import {fetchActiveBets, fetchBetDetail, fetchNodeInfo} from '../components/qubic/util/betApi';
import {backendUrl} from '../components/qubic/util/commons'

const QuotteryContext = createContext()


const betReducer = (state, action) => {
  switch (action.type) {
    case 'SET_BETS':
      return {
        ...state,
        bets: action.payload
      }
    case 'SET_NODE_INFO':
      return {
        ...state,
        nodeInfo: action.payload
      }
    default:
      return state
  }
}

const ifExceedsDatetime = (compareDate, compareTime) => {
  const date = new Date(`20${compareDate}T${compareTime}Z`); // Create a new Date object with the compareDate and compareTime
  const now = new Date(); // Get the current date and time
  return now > date; // Return true if current date/time exceeds compare date/time
};

export const QuotteryProvider = ({children}) => {
  const [state, dispatch] = useReducer(betReducer, {bets: [], nodeInfo: {}})
  const [loading, setLoading] = useState(true)
  const [betsFilter, setBetsFilter] = useState('active')
  const {wallet, broadcastTx, getTick} = useQubicConnect()
  const qHelper = new QubicHelper()

  // Fetch bets using the Qubic HTTP API
  const fetchQubicHttpApiBets = async (maxRetryCount = 3) => {
    for (let i = 0; i < maxRetryCount; i++) {
      try {
        const activeBetIds = await fetchActiveBets();

        return Promise.all(
          activeBetIds.map(async (betId) => {
            const bet = await fetchBetDetail(betId);
            bet.creator = await qHelper.getIdentity(bet.creator); // Update creator field with human-readable identity
            bet.oracle_id = await Promise.all(
              bet.oracle_id.map(async (oracleId) => {
                return await qHelper.getIdentity(oracleId);
              })
            );

            const closeDate = new Date('20' + bet.close_date + 'T' + bet.close_time + 'Z');
            const now = new Date();
            bet.is_active = now <= closeDate;

            return bet;
          })
        );
      } catch (error) {
        console.log('Error occurred while fetching bets with Qubic Http.');
        console.log(error);
        if (i < maxRetryCount - 1) {
          console.log('Retrying...');
        } else {
          console.log('Unable to fetch bets with Qubic Http API. Falling back to using backend API.');
          return null;
        }
      }
    }
  };

  const fetchBackendApiBets = async (filter) => {
    const response = await fetch(`${backendUrl}/get_${filter}_bets`);
    const data = await response.json();

    if (data.bet_list) {
      data.bet_list.forEach((bet) => {
        // parse list fields using JSON.parse
        bet.oracle_fee = JSON.parse(bet.oracle_fee);
        bet.oracle_id = JSON.parse(bet.oracle_id);
        bet.option_desc = JSON.parse(bet.option_desc);
        bet.betting_odds = JSON.parse(bet.betting_odds);
        bet.current_bet_state = JSON.parse(bet.current_bet_state);
        bet.current_num_selection = JSON.parse(bet.current_num_selection);
        bet.oracle_vote = JSON.parse(bet.oracle_vote);
        const closeDate = new Date('20' + bet.close_date + 'T' + bet.close_time + 'Z');
        const now = new Date();
        bet.is_active = now <= closeDate;
      });
    }

    return data.bet_list || [];
  };

  const areBetsEqual = (bet1, bet2) => {
    // Compare all relevant fields of the bets
    return (
      bet1.bet_id === bet2.bet_id &&
      bet1.nOption === bet2.nOption &&
      bet1.creator === bet2.creator &&
      bet1.bet_desc === bet2.bet_desc &&
      JSON.stringify(bet1.option_desc) === JSON.stringify(bet2.option_desc) &&
      JSON.stringify(bet1.oracle_id) === JSON.stringify(bet2.oracle_id) &&
      JSON.stringify(bet1.oracle_fee) === JSON.stringify(bet2.oracle_fee) &&
      bet1.open_date === bet2.open_date &&
      bet1.close_date === bet2.close_date &&
      bet1.end_date === bet2.end_date &&
      bet1.open_time === bet2.open_time &&
      bet1.close_time === bet2.close_time &&
      bet1.end_time === bet2.end_time &&
      bet1.amount_per_bet_slot === bet2.amount_per_bet_slot &&
      bet1.maxBetSlotPerOption === bet2.maxBetSlotPerOption &&
      JSON.stringify(bet1.current_bet_state) === JSON.stringify(bet2.current_bet_state) &&
      JSON.stringify(bet1.current_num_selection) === JSON.stringify(bet2.current_num_selection) &&
      JSON.stringify(bet1.betResultWonOption) === JSON.stringify(bet2.betResultWonOption) &&
      JSON.stringify(bet1.betResultOPId) === JSON.stringify(bet2.betResultOPId) &&
      bet1.current_total_qus === bet2.current_total_qus &&
      JSON.stringify(bet1.betting_odds) === JSON.stringify(bet2.betting_odds)
    );
  };

  const fetchBets = async (filter) => {
    setLoading(true);

    if (filter === 'active' || filter === 'locked') {
      try {
        const allCoreBets = await fetchQubicHttpApiBets();

        if (!allCoreBets) { // Check if fetchQubicHttpApiBets returned null
          // If null, fall back to backend API
          console.log('Fetching from Backend API due to Qubic Http API failure.');
          const backendBets = await fetchBackendApiBets(filter);
          dispatch({
            type: 'SET_BETS',
            payload: backendBets,
          });
        } else {
          const filtered_bets = allCoreBets.filter((bet) => {
            if (filter === 'active') {
              return !ifExceedsDatetime(bet.close_date, bet.close_time); // Active bets should not exceed the close date/time
            } else if (filter === 'locked') {
              return ifExceedsDatetime(bet.close_date, bet.close_time) && !ifExceedsDatetime(bet.end_date, bet.end_time); // Locked bets should not exceed the end date/time
            }
            return false;
          });

          dispatch({
            type: 'SET_BETS',
            payload: filtered_bets,
          });
        }

        await fetchNodeInfoAndUpdate();
      } catch (error) {
        console.error("Error fetching bets:", error);
      }
    } else if (filter === 'inactive') {
      try {
        // Fetch from Backend API
        const inactiveBetsData = await fetchBackendApiBets(filter);
        const inactiveBets = inactiveBetsData.filter((bet) =>
          ifExceedsDatetime(bet.end_date, bet.end_time)
        );
        dispatch({
          type: 'SET_BETS',
          payload: inactiveBets,
        });

        await fetchNodeInfoAndUpdate();
      } catch (error) {
        console.error('Error fetching bets:', error);
      }
    } else { //  if (filter === 'all')
      try {
        const [qubicApiBets, backendApiBets] = await Promise.allSettled([
          fetchQubicHttpApiBets(),
          fetchBackendApiBets(filter),
        ]);

        let allBets = [];
        if (qubicApiBets.status === 'fulfilled' && qubicApiBets.value) {
          allBets = qubicApiBets.value;
        }
        if (backendApiBets.status === 'fulfilled') {
          const backendBets = backendApiBets.value;
          // Remove duplicates
          const backendBetsUnique = backendBets.filter(
            (backendBet) => !allBets.some((qubicBet) => areBetsEqual(qubicBet, backendBet))
          );
          allBets = allBets.concat(backendBetsUnique);
        }

        dispatch({type: 'SET_BETS', payload: allBets});
        await fetchNodeInfoAndUpdate();
      } catch (error) {
        console.error('Error fetching bets:', error);
      }
    }

    setLoading(false)
  }

  const fetchNodeInfoAndUpdate = async () => {
    try {
      const nodeInfo = await fetchNodeInfo();
      nodeInfo.game_operator = await qHelper.getIdentity(nodeInfo.game_operator);
      dispatch({
        type: 'SET_NODE_INFO',
        payload: nodeInfo,
      });
    } catch (error) {
      console.error("Error fetching node info:", error);
    }
  };

  useEffect(() => {
    fetchBets(betsFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [betsFilter])

  // Helper function to write a fixed-size byte array or string
  const writeFixedSizeString = (view, offset, str, size) => {
    for (let i = 0; i < size; i++) {
      if (i < str.length) {
        view.setUint8(offset + i, str.charCodeAt(i))
      } else {
        view.setUint8(offset + i, 0) // Padding with zero if string is shorter
      }
    }
  }

  // Helper function to write an array of fixed-size strings
  const writeFixedSizeStringArray = (view, offset, arr, size) => {
    for (let i = 0; i < arr.length; i++) {
      writeFixedSizeString(view, offset + i * size, arr[i], size)
    }
  }

  const packQuotteryDateFromObject = ({date, time}) => {
    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)
    const second = 0 // Assuming second is always 0 as it is not provided

    return packQuotteryDate(year, month, day, hour, minute, second)
  }

  // Function to pack the date into a 32-bit integer
  const packQuotteryDate = (year, month, day, hour, minute, second) => {
    year = year - 2000
    return ((year - 24) << 26) | (month << 22) | (day << 17) | (hour << 12) | (minute << 6) | second
  }

  const issueBetTxCosts = async (bet) => {
    const nodeInfo = await fetchNodeInfo()
    return parseInt(bet.maxBetSlots) * bet.options.length * nodeInfo.fee_per_slot_per_hour * calculateDiffHours(bet)
  }

  const calculateDiffHours = (bet) => {
    // Parse the end date-time from the bet object
    const endDateTime = new Date(Date.UTC(
      parseInt(bet.endDateTime.date.split('-')[0]), // Year
      parseInt(bet.endDateTime.date.split('-')[1]) - 1, // Month (0-based)
      parseInt(bet.endDateTime.date.split('-')[2]), // Day
      parseInt(bet.endDateTime.time.split(':')[0]), // Hour
      parseInt(bet.endDateTime.time.split(':')[1]), // Minute
      0 // Second
    ))

    // Get the current date-time in UTC
    const nowDateTime = new Date()
    const nowUTC = new Date(Date.UTC(
      nowDateTime.getUTCFullYear(),
      nowDateTime.getUTCMonth(),
      nowDateTime.getUTCDate(),
      nowDateTime.getUTCHours(),
      nowDateTime.getUTCMinutes(),
      nowDateTime.getUTCSeconds()
    ))

    // Calculate the difference in milliseconds and convert to hours
    const diffMilliseconds = endDateTime - nowUTC
    return Math.ceil(diffMilliseconds / 1000 / 60 / 60)
  }

  const signIssueBetTx = async (bet) => {
    const idPackage = await qHelper.createIdPackage(wallet)
    const qCrypto = await Crypto
    const tick = await getTick()
    const tickOffset = 4
    console.log('Target Tick:', tick + tickOffset)
    // build Quottery TX
    const quotteryDataSize = 600
    const quotteryTxSize = qHelper.TRANSACTION_SIZE + quotteryDataSize
    const sourcePrivateKey = idPackage.privateKey
    const sourcePublicKey = idPackage.publicKey
    // fill all with zero
    const tx = new Uint8Array(quotteryTxSize).fill(0)
    const txView = new DataView(tx.buffer)
    let offset = 0
    let i
    for (i = 0; i < qHelper.PUBLIC_KEY_LENGTH; i++) {
      tx[i] = sourcePublicKey[i]
    }
    offset = i
    tx[offset] = 2 // 2 for Quottery SC
    offset++
    for (i = 1; i < qHelper.PUBLIC_KEY_LENGTH; i++) {
      tx[offset + i] = 0
    }
    offset += i - 1
    txView.setBigInt64(offset, BigInt(await issueBetTxCosts(bet)), true); // amount
    offset += 8
    txView.setUint32(offset, tick + tickOffset, true) // tick
    offset += 4
    txView.setUint16(offset, 1, true) // inputType for issue bet is 1
    offset += 2
    txView.setUint16(offset, quotteryDataSize, true); // inputSize for issue bet is 600
    offset += 2
    //
    // add issue bet specific data
    //
    // id betDesc; // bet description / 32 bytes
    // id_8 optionDesc; // options description / 32 bytes x 8 = 256 bytes
    // id_8 oracleProviderId; // oracle provider ids / 32 bytes x 8 = 256 bytes
    // uint32_8 oracleFees;   // oracle fees / 4 bytes x 8 = 32 bytes
    // uint32 closeDate; // close date / 4 bytes
    // uint32 endDate; // end date / 4 bytes
    // uint64 amountPerSlot; // 8 bytes
    // uint32 maxBetSlotPerOption; // 4 bytes
    // uint32 numberOfOption; // 4 bytes
    //
    // Write betDesc (32 bytes)
    writeFixedSizeString(txView, offset, bet.description, 32)
    offset += 32
    // Write optionDesc (32 bytes x 8)
    writeFixedSizeStringArray(txView, offset, bet.options, 32)
    offset += 32 * 8
    // Write oracleProviderId (32 bytes x 8)
    writeFixedSizeStringArray(txView, offset, bet.providers.map(p => p.publicId), 32)
    offset += 32 * 8
    // Write oracleFees (uint32 x 8)
    bet.providers.forEach((provider, i) => {
      provider.fee = parseInt(provider.fee * 100) // parse "12.23" to 1223
      txView.setUint32(offset, provider.fee, true)
      offset += 4
    })
    // increase offset by 4 bytes for each non existing provider
    for (let i = bet.providers.length; i < 8; i++) {
      offset += 4
    }
    // Write closeDate (uint32)
    txView.setUint32(offset, packQuotteryDateFromObject(bet.closeDateTime), true)
    offset += 4
    // Write endDate (uint32)
    txView.setUint32(offset, packQuotteryDateFromObject(bet.endDateTime), true)
    offset += 4
    // Write amountPerSlot (uint64)
    txView.setBigUint64(offset, BigInt(bet.amountPerSlot), true)
    offset += 8
    // Write maxBetSlotPerOption (uint32)
    txView.setUint32(offset, parseInt(bet.maxBetSlots), true)
    offset += 4
    // Write numberOfOption (uint32)
    txView.setUint32(offset, bet.options.length, true)
    offset += 4

    // get digest
    const digest = new Uint8Array(qHelper.DIGEST_LENGTH)

    // sign tx
    const toSign = tx.slice(0, offset)
    qCrypto.K12(toSign, digest, qHelper.DIGEST_LENGTH)
    const signedtx = qCrypto.schnorrq.sign(sourcePrivateKey, sourcePublicKey, digest)
    tx.set(signedtx, offset)
    offset += qHelper.SIGNATURE_LENGTH

    console.log('bet:', bet)
    const txResult = await broadcastTx(tx)
    console.log('Response:', txResult)

    return {
      targetTick: tick + tickOffset,
      txResult
    }
  }

  return (
    <QuotteryContext.Provider value={{
      state, dispatch, loading, fetchBets, setBetsFilter,
      signIssueBetTx, issueBetTxCosts
    }}>
      {children}
    </QuotteryContext.Provider>
  )
}

export const useQuotteryContext = () => useContext(QuotteryContext)
