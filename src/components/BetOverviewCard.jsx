import React from "react"
import Card from "./qubic/Card"
import QubicCoin from "../assets/qubic-coin.svg"
import { formatQubicAmount } from "./qubic/util"
import LabelData from "./LabelData"
import { sumArray } from "./qubic/util"
import {formatDate} from "../components/qubic/util/commons"

function BetOverviewCard({ data, onClick, status='' }) {
  const slots_taken = sumArray(data.current_num_selection)
  let status_string = ''
  switch (status) {
    case 'active': {
      status_string = '🟢'
      break
    }
    case 'locked': {
      status_string = '🔒'
      break
    }
    case 'published': {
      status_string = '🎉'
      break
    }
    case 'waiting': {
      status_string = '❓'
      break
    }
    default: {
      status_string = ''
    }
  }

  // Bet badges
  let hot_level = ''
  if (data.current_total_qus >= 1000000000 || slots_taken >= 100) { // 1bil
    hot_level = '💎' // Level Giant Diamond
  } else if (data.current_total_qus >= 500000000 || slots_taken >= 50) { // 500mil
    hot_level = '🐦‍🔥' // Level Fire Phoenix
  } else if (data.current_total_qus >= 100000000 || slots_taken >= 10) { // 100mil
    hot_level = '🔥' // Level Holy Flame
  } else if (data.current_total_qus >= 10000000 || slots_taken >= 5) { // 50mil
    hot_level = '🐣' // Level Chick
  } else if (data.current_total_qus >= 0) {
    hot_level = '🥚' // Level Egg
  }

  return (
    <Card
      className="p-[15px] h-[290px] hover:border-primary-40 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-start justify-start justify-between gap-[8px] h-full">
        <div className="text-white text-20 line-clamp-3 overflow-hidden">
          {
            `${status_string}${data.full_description ? data.full_description : data.bet_desc}`
          }
        </div>
        <div className="grid grid-cols-2 justify-between items-center w-full">
          <LabelData lbl="Bet closes at"
                     value={`${formatDate(data.close_date)} ${data.close_time.slice(0, -3)} UTC`}
          />
          <LabelData lbl="Slots taken" value={sumArray(data.current_num_selection)} />
          <LabelData
            lbl="Fee %"
            value={sumArray(data.oracle_fee) + ' %'}
          />
          <LabelData
            lbl="Burning"
            value={'2 %'}
          />
        </div>
        <div className="gap-[12px] flex justify-center items-center w-full">
          ${hot_level}
          <img src={QubicCoin} alt="" />
          <span className="text-white text-18">
            {formatQubicAmount(data.current_total_qus)} QUBIC
          </span>
        </div>
      </div>
    </Card>
  )
}

export default BetOverviewCard
