import lock from "../../../assets/lock.svg"
import unlocked from "../../../assets/unlocked.svg"
import ConnectModal from "./ConnectModal"
import {useQubicConnect} from "./QubicConnectContext"
import {useQuotteryContext} from '../../../contexts/QuotteryContext'
import {formatQubicAmount} from "../util"

const ConnectLink = () => {
  const {connected, showConnectModal, toggleConnectModal} = useQubicConnect()
  const {balance, fetchBalance, walletPublicIdentity} = useQuotteryContext()

  const handleBalanceClick = (e) => {
    e.stopPropagation()
    if (walletPublicIdentity) {
      fetchBalance(walletPublicIdentity)
    }
  }

  console.log('balance:', balance)

  return (<>
    <div className="absolute right-12 sm:right-12 flex gap-[10px] justify-center items-center cursor-pointer"
         onClick={() => toggleConnectModal()}
    >
      {connected ? <>
        <div className="flex flex-col items-center">
          <span
            className='hidden md:flex font-space items-center flex-row text-[16px] text-gray-50 mt-[5px] font-[500]'>
            <img src={lock} alt="locked lock icon" className="mr-2"/>
            <span>Lock Wallet</span>
          </span>
          {balance && (
            <div className="text-white mt-2 text-[14px] cursor-pointer"
                 onClick={handleBalanceClick}
                 title="Click to refresh balance"
            >
              Balance: {formatQubicAmount(balance)} QUBIC
            </div>
          )}
        </div>
      </> : <>
        <span className='hidden md:block font-space text-[16px] text-gray-50 mt-[5px] font-[500]'>
          Unlock Wallet
        </span>
        <img src={unlocked} alt="unlocked lock icon"/>
      </>}
    </div>
    <ConnectModal
      open={showConnectModal}
      onClose={() => toggleConnectModal()}
    />
  </>)
}

export default ConnectLink
