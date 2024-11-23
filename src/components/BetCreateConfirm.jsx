/* global BigInt */
import React, { useEffect, useState } from 'react'
import { truncateMiddle } from './qubic/util'
import { useQuotteryContext } from '../contexts/QuotteryContext'
import {formatQubicAmount} from "./qubic/util"

const BetCreateConfirm = ({ bet }) => {

  const { issueBetTxCosts, balance, fetchBalance, walletPublicIdentity } = useQuotteryContext()
  const [hasEnoughBalance, setHasEnoughBalance] = useState(true)

  useEffect(() => {
    const calculateCosts = async (bet) => {
      const costs = await issueBetTxCosts(bet)
      if (walletPublicIdentity) {
        await fetchBalance(walletPublicIdentity)
      }
      if (balance !== null) {
        setHasEnoughBalance(BigInt(balance) >= BigInt(costs))
      }
    }
    calculateCosts(bet)
  }, [bet, balance, issueBetTxCosts, fetchBalance, walletPublicIdentity])

  return (
    <div className="p-4 bg-gray-800 text-white border-top border-y-6 border-gray-80 border-dotted">
      <h2 className="text-2xl font-semibold mb-4">Bet Details</h2>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Description</h3>
        <p>{bet.descriptionFull}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Close Date and Time</h3>
        <p>{bet.closeDateTime.date} {bet.closeDateTime.time}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">End Date and Time</h3>
        <p>{bet.endDateTime.date} {bet.endDateTime.time}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Options</h3>
        <ul className="list-disc list-inside">
          {bet.options.map((option, index) => (
            <li key={index}>{option}</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Oracle Providers</h3>
        <ul className="list-disc list-inside">
          {bet.providers.map((provider, index) => (
            <li key={index}>{truncateMiddle(provider.publicId, 40)} - {provider.fee} %</li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Number of Qus per Slot</h3>
        <p>{bet.amountPerSlot} QUBIC</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Max. Number of Bet Slots per Option</h3>
        <p>{bet.maxBetSlots}</p>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Issue Bet Costs</h3>
        <p>{bet.costs} QUBIC</p>
      </div>

      {balance !== null && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Your Balance</h3>
          <p>{formatQubicAmount(balance)} QUBIC</p>
          {hasEnoughBalance ? (
            <></>// <p className="text-green-500">You have enough balance to create this bet.</p>
          ) : (
            <p className="text-red-500">
              {`You do not have enough balance to create this bet. Your balance: ${formatQubicAmount(balance)} Qubic${balance > 1 ? 's' : ''}, bet creation fee: ${formatQubicAmount(bet.costs)} Qubic${bet.costs > 1 ? 's' : ''}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default BetCreateConfirm;
