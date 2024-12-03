import {useState} from 'react'
import {QubicVault} from '@qubic-lib/qubic-ts-vault-library'
import Card from '../Card'
import {useQubicConnect} from './QubicConnectContext'
import QubicConnectLogo from '../../../assets/qubic-connect.svg'
import CloseIcon from '../../../assets/close.svg'
import {useConfig} from "../../../contexts/ConfigContext"

const ConnectModal = ({open, onClose}) => {
  const [selectedWalletMode, setSelectedWalletMode] = useState('none')
  const [selectedServerMode, setSelectedServerMode] = useState('none')

  // Private seed handling
  const [privateSeed, setPrivateSeed] = useState('')
  const [errorMsgPrivateSeed, setErrorMsgPrivateSeed] = useState('')
  // Vault file handling
  const [vault] = useState(new QubicVault())
  const [selectedFile, setSelectedFile] = useState(null)
  const [password, setPassword] = useState('')
  // General connect/disconnect
  const {connect, disconnect, connected} = useQubicConnect()
  // account selection
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(0)
  // Server config handling
  const {updateEndpoints, connectedToCustomServer, resetEndpoints} = useConfig()
  const [httpEndpointInput, setHttpEndpointInput] = useState('')
  const [backendUrlInput, setBackendUrlInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const privateKeyConnect = () => {
    connect(privateSeed)
    // reset and close
    setSelectedWalletMode('none')
    setPrivateSeed('')
    onClose()
  }

  // check if input is valid seed (55 chars and only lowercase letters)
  const privateKeyValidate = (pk) => {
    if (pk.length !== 55) {
      setErrorMsgPrivateSeed('Seed must be 55 characters long')
    }
    if (pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed('Seed must contain only lowercase letters')
    }
    if (pk.length === 55 && !pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed('')
    }
    setPrivateSeed(pk)
  }

  const vaultFileConnect = async () => {
    if (!selectedFile || !password) {
      alert('Please select a file and enter a password.')
      return
    }

    const fileReader = new FileReader()

    fileReader.onload = async () => {
      try {
        await vault.importAndUnlock(
          true, // selectedFileIsVaultFile: boolean,
          password,
          null, // selectedConfigFile: File | null = null,
          selectedFile, // File | null = null,
          true, // unlock: boolean = false
        )
        // now we switch view to select one of the seeds
        const accountList = vault.getSeeds().filter((account) => !account.isOnlyWatch)

        if (accountList.length === 0) {
          throw new Error('No eligible accounts found. Only watch-only accounts are listed in the vault file.')
        }

        setAccounts(accountList)
        setSelectedWalletMode('account-select')
      } catch (error) {
        console.error('Error unlocking vault:', error)
        alert('Failed to unlock the vault. Please check your password and try again.')
      }
    }

    fileReader.onerror = (error) => {
      console.error('Error reading file:', error)
      alert('Failed to read the file. Please try again.')
    }

    fileReader.readAsArrayBuffer(selectedFile)
  }

  const selectAccount = async () => {
    // get the first account of the vault
    const pkSeed = await vault.revealSeed(
      accounts[parseInt(selectedAccount)].publicId
    )
    connect(pkSeed)
    onClose() // reset and close
  }

  const handleFileChange = event => setSelectedFile(event.target.files[0])
  const handlePasswordChange = event => setPassword(event.target.value)

  const handleServerConnect = () => {
    if (!httpEndpointInput || !backendUrlInput) {
      setErrorMsg('Please enter both HTTP Endpoint and Backend URL.')
      return
    }

    try {
      new URL(httpEndpointInput)
      new URL(backendUrlInput)
    } catch (_) {
      setErrorMsg('Please enter valid URLs.')
      return
    }

    updateEndpoints(httpEndpointInput, backendUrlInput)
    setSelectedServerMode('none')
    onClose()

    // Force page reload to apply new server settings
    window.location.reload()
  }

  const handleServerDisconnect = () => {
    resetEndpoints()
    setSelectedServerMode('none')
    onClose()

    // Force page reload to apply default settings
    window.location.reload()
  }

  return (<>
    {open && <div
      className="w-full p-5 h-full fixed top-0 left-0 overflow-x-hidden overflow-y-auto z-50 bg-smoke-light flex"
      onClick={() => {
        setSelectedServerMode('none')
        onClose()
      }}
    >
      <Card className="relative p-8 w-full max-w-md m-auto flex-col flex" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <img src={QubicConnectLogo} alt="Qubic Connect Logo" className="h-6"/>
          <img src={CloseIcon} onClick={onClose} alt="Close Modal Icon" className="w-5 h-5 cursor-pointer"/>
        </div>

        <div className="mt-4">
          {selectedWalletMode === 'none' &&
            <div className="flex flex-col gap-4">
              {connected &&
                <button className="bg-primary-40 p-4 rounded-lg text-black" onClick={() => disconnect()}>
                  Lock Wallet
                </button>
              }
              {!connected && <>
                <button
                  className="bg-primary-40 p-4 rounded-lg"
                  onClick={() => setSelectedWalletMode('private-seed')}>
                  Private Seed
                </button>
                <button
                  className="bg-primary-40 p-4 rounded-lg"
                  onClick={() => setSelectedWalletMode('vault-file')}>
                  Vault File
                </button>
              </>}
            </div>
          }

          {selectedWalletMode === 'private-seed' &&
            <div className="text-white mt-4">
              Your 55 character private key (seed):
              <input
                type="text" className="w-full p-4 mt-4 bg-gray-50 rounded-lg"
                value={privateSeed}
                onChange={(e) => privateKeyValidate(e.target.value)}
              />
              {errorMsgPrivateSeed && <p className="text-red-500">{errorMsgPrivateSeed}</p>}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  className="bg-primary-40 p-4 mt-4 rounded-lg text-black"
                  onClick={() => setSelectedWalletMode('none')}>
                  Cancel
                </button>
                <button
                  className="bg-primary-40 p-4 mt-4 rounded-lg text-black"
                  onClick={() => privateKeyConnect()}>Unlock
                </button>
              </div>
            </div>
          }

          {selectedWalletMode === 'vault-file' &&
            <div className="text-white mt-4">
              Load your Qubic vault file:
              <input type="file" className="w-full p-4 mt-4 bg-gray-50 rounded-lg"
                     onChange={handleFileChange}
              />
              <input type="password" className="w-full p-4 mt-4 bg-gray-50 rounded-lg" placeholder="Enter password"
                     onChange={handlePasswordChange}
              />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  className="bg-primary-40 p-4 mt-4 rounded-lg text-black"
                  onClick={() => setSelectedWalletMode('none')}>
                  Cancel
                </button>
                <button
                  className="bg-primary-40 p-4 mt-4 rounded-lg text-black"
                  onClick={() => vaultFileConnect()}>Unlock
                </button>
              </div>
            </div>
          }

          {selectedWalletMode === 'account-select' &&
            <div className="text-white mt-4">
              Select an account:
              <select className="w-full p-4 mt-4 bg-gray-50 rounded-lg"
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
              >
                {accounts.map((account, idx) =>
                  <option key={account.publicId} value={idx}>
                    {`${account.alias} (${account.publicId})`}
                  </option>
                )}
              </select>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button
                  className="bg-primary-40 p-4 mt-4 rounded-lg text-black"
                  onClick={() => {
                    disconnect()
                    setSelectedWalletMode('none')
                  }}>
                  Lock Wallet
                </button>
                <button
                  className="bg-primary-40 p-4 mt-4 rounded-lg text-black"
                  onClick={() => selectAccount()}>Select Account
                </button>
              </div>
            </div>
          }
        </div>

        {/* Separator */}
        <hr className="my-6 border-white"/>

        {/* Server Connection Section */}
        <div>
          <h3 className="text-white mb-6 text-center font-bold text-xl">Server Connection</h3>
          {connectedToCustomServer ? (
            <button
              className="bg-primary-40 p-4 rounded-lg text-black w-full"
              onClick={() => handleServerDisconnect()}
            >
              Disconnect from Server
            </button>
          ) : (
            <>
              {selectedServerMode === 'none' && (
                <button
                  className="bg-primary-40 p-4 rounded-lg text-black w-full"
                  onClick={() => setSelectedServerMode('server-config')}>
                  Connect to Server
                </button>)}
              {selectedServerMode === 'server-config' && (
                <div className="mt-4">
                  <label className="block mb-2">HTTP Endpoint:</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 rounded-lg text-black"
                    placeholder="Enter HTTP Endpoint"
                    value={httpEndpointInput}
                    onChange={(e) => setHttpEndpointInput(e.target.value)}
                  />
                  <label className="block mt-4 mb-2">Backend URL:</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-gray-50 rounded-lg text-black"
                    placeholder="Enter Backend URL"
                    value={backendUrlInput}
                    onChange={(e) => setBackendUrlInput(e.target.value)}
                  />
                  {errorMsg && <p className="text-red-500 mt-2">{errorMsg}</p>}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <button
                      className="bg-primary-40 p-4 rounded-lg text-black"
                      onClick={() => setSelectedServerMode('none')}
                    >
                      Cancel
                    </button>
                    <button
                      className="bg-primary-40 p-4 rounded-lg text-black"
                      onClick={() => handleServerConnect()}
                    >
                      Connect
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>}
  </>)
}

export default ConnectModal
