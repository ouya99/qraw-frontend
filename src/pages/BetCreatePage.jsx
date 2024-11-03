import React, {useRef, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import SelectDateTime from '../components/qubic/ui/SelectDateTime'
import InputMaxChars from '../components/qubic/ui/InputMaxChars'
import FormHead from '../components/qubic/ui/FormHead'
import OptionsList from '../components/OptionsList'
import ProvidersList from '../components/ProvidersList'
import InputNumbers from '../components/qubic/ui/InputNumbers'
import ConfirmTxModal from '../components/qubic/connect/ConfirmTxModal'
import {useQubicConnect} from '../components/qubic/connect/QubicConnectContext'
import BetCreateConfirm from '../components/BetCreateConfirm'
import {useQuotteryContext} from "../contexts/QuotteryContext"
import {QubicHelper} from "@qubic-lib/qubic-ts-library/dist/qubicHelper"
import {hashBetData, hashUniqueData} from "../components/qubic/util/hashUtils"

function BetCreatePage() {

  const navigate = useNavigate()
  const [showConfirmTxModal, setShowConfirmTxModal] = useState(false)
  const { connected, toggleConnectModal } = useQubicConnect()
  const { fetchBets, signIssueBetTx } = useQuotteryContext()
  const { wallet } = useQubicConnect()

  const [bet, setBet] = useState({
    description: '',
    closeDateTime: '',
    endDateTime: '',
    options: ['', ''],
    providers: [{
      publicId: '',
      fee: ''
    }],
    amountPerSlot: '',
    maxBetSlots: '',
  })
  const [errors] = useState({})

  const descriptionRef = useRef()
  const closeDateTimeRef = useRef()
  const endDateTimeRef = useRef()
  const amountPerSlotRef = useRef()
  const maxBetSlotsRef = useRef()

  const validateForm = () => {
    const isDescriptionValid = descriptionRef.current.validate()
    const isCloseDateTimeValid = closeDateTimeRef.current.validate()
    const isEndDateTimeValid = endDateTimeRef.current.validate()
    const isOptionsValid = bet.options.length >= 2
    const isProvidersValid = bet.providers.length >= 1 && bet.providers.every(provider => provider.publicId && provider.fee)
    const isAmountPerSlotValid = amountPerSlotRef.current.validate()
    const isMaxBetSlotsValid = maxBetSlotsRef.current.validate()

    if (bet.closeDateTime && bet.endDateTime) {
      const closeDateTime = new Date(`${bet.closeDateTime.date}T${bet.closeDateTime.time}Z`)
      const endDateTime = new Date(`${bet.endDateTime.date}T${bet.endDateTime.time}Z`)

      if (endDateTime <= closeDateTime) {
        alert('End DateTime must be after Close DateTime.')
        return false
      }

    }

    return (
      isDescriptionValid &&
      isCloseDateTimeValid &&
      isEndDateTimeValid &&
      isOptionsValid &&
      isProvidersValid &&
      isAmountPerSlotValid &&
      isMaxBetSlotsValid
    )
  }

  const getCreatorIdentity = async () => {
    const qHelper = new QubicHelper()
    const idPackage = await qHelper.createIdPackage(wallet)
    const sourcePublicKey = idPackage.publicKey
    return await qHelper.getIdentity(sourcePublicKey)
  }


  const uploadDescription = async (description, encodedHash) => {
    try {
      const response = await fetch(`http://91.210.226.146:3000/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hash: encodedHash, description }),
      })
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error uploading description:', error)
      return false
    }
  }

  const handleOptionsChange = newOptions => setBet({...bet, options: newOptions})
  const handleCloseDateTimeChange = dateTime => {
    setBet(prevBet => {
      const newBet = { ...prevBet, closeDateTime: dateTime }

      if (prevBet.endDateTime && prevBet.endDateTime.date && prevBet.endDateTime.time) {
        const closeDateTime = new Date(`${dateTime.date}T${dateTime.time}Z`)
        const endDateTime = new Date(`${prevBet.endDateTime.date}T${prevBet.endDateTime.time}Z`)

        if (endDateTime <= closeDateTime) {
          newBet.endDateTime = '' // Reset end date

          // Reset end date's state
          if (endDateTimeRef.current) {
            endDateTimeRef.current.reset()
          }
        }
      }

      return newBet
    })
  }

  const calculateMinEndDateTime = () => {
    const { date, time } = bet.closeDateTime || {}

    if (!date || !time) {
      return null
    }

    const closeDateTimeStr = `${date}T${time}Z`
    const closeDateTime = new Date(closeDateTimeStr)

    if (isNaN(closeDateTime.getTime())) {
      console.error('Invalid closeDateTime:', closeDateTimeStr)
      return null
    }

    const minEndDateTime = new Date(closeDateTime.getTime() + 60 * 60 * 1000) // Add 1 hour

    const isoString = minEndDateTime.toISOString()
    const minDate = isoString.split('T')[0]
    const minTime = isoString.split('T')[1].slice(0, 5) // Get HH:MM

    return { date: minDate, time: minTime }
  }

  const handleEndDateTimeChange = dateTime => setBet({ ...bet, endDateTime: dateTime })
  const handleProvidersChange = newProviders => setBet({...bet, providers: newProviders})
  const handleAmountPerSlotChange = value => setBet({ ...bet, amountPerSlot: value })
  const handleMaxBetSlotsChange = value => setBet({ ...bet, maxBetSlots: value })

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (connected) {
      if (validateForm()) {
        const closeDateTime = `${bet.closeDateTime.date}T${bet.closeDateTime.time}Z`
        const endDateTime = `${bet.endDateTime.date}T${bet.endDateTime.time}Z`
        const closeDate = new Date(closeDateTime)
        const endDate = new Date(endDateTime)
        const diffHours = (endDate - closeDate) / (1000 * 60 * 60)

        if (diffHours <= 0) {
          console.error('End DateTime must be after Close DateTime.')
          return
        }

        bet.diffHours = diffHours
        console.log('Diff hours:', diffHours)

        // Generate unique identifiers
        const creatorIdentity = await getCreatorIdentity()

        // Generate the first part of the hash
        const firstPartHash = hashBetData(bet.description,
          creatorIdentity,
          bet.providers.map(p => p.publicId),
          bet.options,)

        // Generate the second part of the hash
        const secondPartHash = hashUniqueData()

        // Concatenate both parts to create the final hash
        const finalHash = `${firstPartHash}${secondPartHash}`

        const betDescriptionReference = `###${finalHash}`

        const uploadSuccess = await uploadDescription(bet.description, finalHash)
        if (!uploadSuccess) {
          console.error('Failed to upload description')
          return
        }

        const betToSend = {
          ...bet,
          description: betDescriptionReference,
          descriptionFull: bet.description
        }

        setBet(betToSend)
        console.log('Valid Bet:', betToSend)
        setShowConfirmTxModal(true)
      } else {
        console.log('Form has errors:', errors)
      }
    } else {
      toggleConnectModal()
    }
  }

  return (
    <div className='mt-[90px] sm:px-30 md:px-130'>
      <div className="max-w-3xl mx-auto p-4">

        <FormHead
          title='Create New Bet'
          onBack={() => navigate('/')}
        />

        <form className="space-y-10" onSubmit={handleSubmit}>
          {/* Bet description */}
          <InputMaxChars
            id="description"
            ref={descriptionRef}
            label="Bet description"
            max={100}
            placeholder="Enter bet description"
            onChange={(value) => {
              setBet({ ...bet, description: value })
            }}
          />

          {/* Close Date and Time */}
          <SelectDateTime
            ref={closeDateTimeRef}
            label="Close Date and Time"
            fieldId="close"
            onChange={handleCloseDateTimeChange}
          />

          {/* End Date and Time */}
          <SelectDateTime
            ref={endDateTimeRef}
            label="End Date and Time"
            fieldId="end"
            onChange={handleEndDateTimeChange}
            minDateTime={calculateMinEndDateTime()}
          />

          {/* Bet options */}
          <div>
            <span className="block text-white mb-2">
              Bet Options (min. 2)
            </span>
            <p className='text-grey mb-5'>Here we go with a small help description.</p>

            <OptionsList
              max={8}
              options={bet.options}
              onChange={handleOptionsChange}
            />
            {errors.options && <p className="text-red-500">{errors.options}</p>}
          </div>

          {/* Oracle Providers */}
          <div>
            <span className="block text-white mb-2">
              Oracle Providers (min. 1)
            </span>
            <p className='text-grey mb-5'>Here we go with a small help description.</p>

            <ProvidersList
              max={8}
              providers={bet.providers}
              onChange={handleProvidersChange}
            />
          </div>

          {/* Settings */}
          <InputNumbers
            id="amountPerSlot"
            label="Amount of Qus per Slot"
            placeholder="Enter amount of Qus per slot"
            description="Here we go with a small help description."
            ref={amountPerSlotRef}
            onChange={handleAmountPerSlotChange}
          />

          <InputNumbers
            id="maxBetSlots"
            label="Maximum Number of Bet Slots per Option"
            placeholder="Enter max bet slots"
            description="Here we go with a small help description."
            ref={maxBetSlotsRef}
            maxLimit={1024}
            onChange={handleMaxBetSlotsChange}
          />

          {/* Create Bet button */}
          <div>
            <button
              className="w-full p-4 bg-primary-40 text-black rounded-lg"
              onClick={handleSubmit}
            >
              Create Bet
            </button>
          </div>
        </form>
      </div>

      <ConfirmTxModal
        open={showConfirmTxModal}
        onClose={() => {
          fetchBets('active')
          setShowConfirmTxModal(false)
          navigate('/')
        }}
        tx={{
          title: 'Create Bet',
          description: <BetCreateConfirm bet={bet} />,
        }}
        onConfirm={async () => {
          return await signIssueBetTx(bet)
        }}
      />
    </div>
  )
}

export default BetCreatePage
