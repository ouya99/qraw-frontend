import React, {useEffect, useState} from 'react'
import {useNavigate, useParams} from 'react-router-dom'
import {useQuotteryContext} from '../contexts/QuotteryContext'
import {useQubicConnect} from '../components/qubic/connect/QubicConnectContext'
import ConfirmTxModal from '../components/qubic/connect/ConfirmTxModal'
import Card from '../components/qubic/Card'
import {QubicHelper} from "@qubic-lib/qubic-ts-library/dist/qubicHelper"
import {bytesEqual} from '../components/qubic/util/commons'

const BetPublishPage = () => {
  const { id } = useParams()
  const { state, fetchBets, signPublishResultTx } = useQuotteryContext()
  const { connected, toggleConnectModal, wallet } = useQubicConnect()
  const [bet, setBet] = useState(null)
  const [selectedOption, setSelectedOption] = useState(null)
  const [showConfirmTxModal, setShowConfirmTxModal] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const qHelper = new QubicHelper()

    const betDetails = state.bets.find((b) => b.bet_id === parseInt(id))
    if (betDetails) {
      setBet(betDetails)
      const checkIfUserIsProvider = async () => {
        const idPackage = await qHelper.createIdPackage(wallet)
        const userPublicId = qHelper.getIdentity(idPackage.publicKey)

        var isProvider = false

        if (bet.oracle_public_keys && bet.oracle_public_keys.length > 0) {
          isProvider = bet.oracle_public_keys.some((providerKey) => {
            return bytesEqual(providerKey, userPublicId)
          })
        } else if (bet.oracle_id && bet.oracle_id.length > 0) {
          // Bet from backend API with oracle IDs (identities)
          const userIdentity = await qHelper.getIdentity(userPublicId)
          isProvider = bet.oracle_id.some((providerId) => providerId === userIdentity)
        }

        if (!isProvider) {
          alert('You are not authorized to publish the result of this bet.')
          navigate('/')
        }
      }

      checkIfUserIsProvider()
    } else {
      fetchBets('all')
    }
  }, [id, state.bets, fetchBets, wallet, navigate])

  const handlePublish = async () => {
    if (!connected) {
      toggleConnectModal()
      return
    }
    setShowConfirmTxModal(true)
  }

  return (
    <div className="mt-[90px] sm:px-30 md:px-130">
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl text-white">Publish Bet Result</h1>
        {bet && (
          <>
            <Card className="p-[24px] w-full mt-[16px]">
              <h2 className="text-xl text-white">{bet.bet_desc}</h2>
              <p className="text-gray-50">Bet ID: {bet.bet_id}</p>
            </Card>
            <div className="mt-4">
              <h3 className="text-white mb-2">Select Winning Option</h3>
              {bet.option_desc.map((option, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="radio"
                    name="winningOption"
                    value={index}
                    checked={selectedOption === index}
                    onChange={() => setSelectedOption(index)}
                    className="mr-2"
                  />
                  <label className="text-white">{option}</label>
                </div>
              ))}
            </div>
            <button
              className="mt-4 p-2 bg-primary-40 text-black rounded-lg"
              onClick={handlePublish}
              disabled={selectedOption === null}
            >
              Publish Result
            </button>
          </>
        )}
      </div>
      <ConfirmTxModal
        open={showConfirmTxModal}
        onClose={() => {
          setShowConfirmTxModal(false)
          navigate('/')
        }}
        tx={{
          title: 'Publish Result',
          description: 'Are you sure you want to publish this result?',
        }}
        onConfirm={async () => {
          return await signPublishResultTx(bet.bet_id, selectedOption)
        }}
      />
    </div>
  )
}

export default BetPublishPage
