import React, {useState, useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import BetOverviewCard from '../components/BetOverviewCard'
import Dropdown from '../components/qubic/Dropdown'
import {useQuotteryContext} from '../contexts/QuotteryContext'
import LoadingSpinner from '../components/LoadingSpinner'

function StartPage() {
  const navigate = useNavigate()
  const {state, loading, setBetsFilter, fetchBets, historicalLoading, fetchHistoricalBets} = useQuotteryContext()
  const [currentFilterOption, setCurrentFilterOption] = useState(1) // 0 = All, 1 = Active, 2 = Locked, 3 = Inactive
  const [currentPage, setCurrentPage] = useState(1)
  const [inputPage, setInputPage] = useState('')

  const filterOptions = [
    {label: 'All', value: 'all'},
    {label: 'Active', value: 'active'},
    {label: 'Locked', value: 'locked'},
    {label: 'Inactive', value: 'inactive'},
  ]

  const renderBets = () => {
    if (loading) {
      return <LoadingSpinner
        fullPage={true}/>
    }

    switch (filterOptions[currentFilterOption].value) {
      case 'inactive':
        return (
          <>
            <h2 className="text-3xl font-semibold text-primary-40 text-center mt-12 mb-12">Bets Waiting for Results</h2>
            <div
              className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.waitingForResultsBets.map((bet) => (
                <BetOverviewCard
                  key={bet.bet_id}
                  data={bet}
                  onClick={() => navigate('/bet/' + bet.bet_id)}
                  // status={'waiting'}
                />
              ))}
            </div>

            <h2
              className="text-3xl font-semibold justify-between items-center mt-[48px] px-20 text-primary-40 text-center mt-12 mb-12">Historical
              Bets</h2>
            {renderHistoricalBets()}
          </>
        )
      case 'all':
        return (
          <>
            <h2 className="text-3xl font-semibold text-primary-40 text-center mt-12 mb-12">Active Bets</h2>
            <div
              className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.activeBets.map((bet) => (
                <BetOverviewCard
                  key={bet.bet_id}
                  data={bet}
                  onClick={() => navigate('/bet/' + bet.bet_id)}
                  // status={'active'}
                />
              ))}
            </div>

            <h2 className="text-3xl font-semibold text-primary-40 text-center mt-12 mb-12">Locked Bets</h2>
            <div
              className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.lockedBets.map((bet) => (
                <BetOverviewCard
                  key={bet.bet_id}
                  data={bet}
                  onClick={() => navigate('/bet/' + bet.bet_id)}
                  // status={'locked'}
                />
              ))}
            </div>

            <h2 className="text-3xl font-semibold text-primary-40 text-center mt-12 mb-12">Bets Waiting for Results</h2>
            <div
              className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.waitingForResultsBets.map((bet) => (
                <BetOverviewCard
                  key={bet.bet_id}
                  data={bet}
                  onClick={() => navigate('/bet/' + bet.bet_id)}
                  // status={'waiting'}
                />
              ))}
            </div>

            <h2 className="text-3xl font-semibold text-primary-40 text-center mt-12 mb-12">Historical Bets</h2>
            {renderHistoricalBets()}
          </>
        )
      case 'active':
        return (
          <>
            <div
              className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-12">
              {state.activeBets.map((bet) => (
                <BetOverviewCard
                  key={bet.bet_id}
                  data={bet}
                  onClick={() => navigate('/bet/' + bet.bet_id)}
                  // status={'active'}
                />
              ))}
            </div>
          </>
        )
      case 'locked':
        return (
          <>
            <div
              className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {state.lockedBets.map((bet) => (
                <BetOverviewCard
                  key={bet.bet_id}
                  data={bet}
                  onClick={() => navigate('/bet/' + bet.bet_id)}
                  // status={'locked'}
                />
              ))}
            </div>
          </>
        )
      default:
        return null
    }
  }

  useEffect(() => {
    fetchBets(filterOptions[currentFilterOption].value, currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilterOption])

  useEffect(() => {
    if (filterOptions[currentFilterOption].value === 'inactive' || filterOptions[currentFilterOption].value === 'all') {
      let coreNodeBets = [...state.activeBets, ...state.lockedBets, ...state.waitingForResultsBets]
      fetchHistoricalBets(coreNodeBets, filterOptions[currentFilterOption].value, currentPage)
    }
  }, [currentPage, state.activeBets, state.lockedBets, state.waitingForResultsBets])

  const renderHistoricalBets = () => {
    return (
      <div className="relative">
        {historicalLoading && <LoadingSpinner/>}
        <div>
          <div
            className="grid justify-between items-center mt-[48px] px-20 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.historicalBets.map((bet) => (
              <BetOverviewCard
                key={bet.bet_id}
                data={bet}
                onClick={() => navigate('/bet/' + bet.bet_id)}
                // status={bet.result !== -1 ? 'published' : ''}
              />
            ))}
          </div>
          {renderPaginationControls()}
        </div>
      </div>
    )
  }

  const renderPaginationControls = () => {
    const {currentPage, totalPages} = state.historicalPagination

    // Determine the range of page numbers to display
    const pageNumbers = []
    const maxPageNumbersToShow = 11 // Current page + 5 before and after
    let startPage = Math.max(currentPage - 5, 1)
    let endPage = Math.min(currentPage + 5, totalPages)

    // Adjust the range if there are not enough pages at the beginning or end
    if (currentPage <= 6) {
      endPage = Math.min(11, totalPages)
    } else if (currentPage + 5 >= totalPages) {
      startPage = Math.max(totalPages - 10, 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    const handleGoToPage = () => {
      const pageNumber = parseInt(inputPage)
      if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber)
        setInputPage('')
      } else {
        alert(`Please enter a valid page number between 1 and ${totalPages}`)
      }
    }

    return (
      <div className={"mt-4"}>
        <div className="flex justify-center items-center mt-4">
          {/* First Button */}
          <button
            className="px-2 py-1 mx-1 bg-gray-700 text-white rounded disabled:opacity-50"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </button>

          {/* Previous Button */}
          <button
            className="px-2 py-1 mx-1 bg-gray-700 text-white rounded disabled:opacity-50"
            onClick={() => {
              if (currentPage > 1) {
                setCurrentPage(currentPage - 1)
              }
            }}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {/* Page Numbers */}
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`px-2 py-1 mx-1 rounded ${
                pageNumber === currentPage
                  ? 'bg-primary-40 text-white'
                  : 'bg-gray-700 text-white hover:bg-primary-20 hover:text-black'
              }`}
              onClick={() => {
                if (pageNumber !== currentPage) {
                  setCurrentPage(pageNumber)
                }
              }}
            >
              {pageNumber}
            </button>
          ))}

          {/* Next Button */}
          <button
            className="px-2 py-1 mx-1 bg-gray-700 text-white rounded disabled:opacity-50"
            onClick={() => {
              if (currentPage < totalPages) {
                setCurrentPage(currentPage + 1)
              }
            }}
            disabled={currentPage === totalPages}
          >
            Next
          </button>

          {/* Last Button */}
          <button
            className="px-2 py-1 mx-1 bg-gray-700 text-white rounded disabled:opacity-50"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </button>
        </div>
        {/* Go to Page Input */}
        <div className="flex justify-center items-center mt-4">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGoToPage()
              }
            }}
            className="w-16 px-2 py-1 border border-gray-300 rounded mr-2 text-black"
          />
          <button
            onClick={handleGoToPage}
            className="px-4 py-1 bg-gray-700 text-white rounded"
          >
            Go
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='sm:px-30 md:px-130'>
      <div className='mt-40 text-center'>
        <span className='text-40 md:text-48 font-space text-white'>
          Bet on anything.<span className=' text-primary-40'> Anytime.</span>
        </span>
      </div>
      <div className='text-gray-50 mt-[24px] text-center font-space'>
        <span className='text-[18px]'>Join the ultimate P2P betting revolution. Safe, Secure and Exciting.</span>
      </div>
      <div className=' flex justify-center items-center mt-[32px] '>
        <button
          className='bg-[rgba(26,222,245,0.1)] py-[8px] px-[16px] text-[14px] text-primary-40 font-space rounded-[8px]'
          onClick={() => navigate('/create')}
        >
          Create Bet
        </button>
      </div>
      <div className='flex justify-between items-center mt-[48px] px-20'>
        <span className='text-white font-space'>
          {filterOptions[currentFilterOption].label} Bets
        </span>
        <Dropdown
          label={'Filter Bets'}
          options={filterOptions}
          selected={currentFilterOption}
          setSelected={(idx) => {
            setCurrentFilterOption(idx)
            setCurrentPage(1) // Reset to page 1 when filter changes
            setBetsFilter(filterOptions[idx].value)
          }}
        />
      </div>
      {renderBets()}
    </div>
  )
}

export default StartPage
