import BigNumber from 'bignumber.js'
import Link from 'next/link'
import React from 'react'
import { useSelector } from 'react-redux'
import { Currency, CurrencyState, RootState, TokenState } from 'store/types'
import { currencyFormat } from 'utils/format'
import { BIG_ZERO } from 'utils/strings'
import useBalances from 'utils/useBalances'
import useMoneyFormatter, { toBigNumber } from 'utils/useMoneyFormatter'
import EmptyRow from './EmptyRow'
import TokenIcon from './TokenIcon'

function PortfolioPools() {
  const moneyFormat = useMoneyFormatter({ maxFractionDigits: 5 })
  const tokenState = useSelector<RootState, TokenState>(state => state.token)
  const currencyState = useSelector<RootState, CurrencyState>(state => state.currency)
  const selectedCurrency: Currency = currencyState.currencies.find(currency => currency.code === currencyState.selectedCurrency)!
  const { membership } = useBalances()

  let filteredTokens = tokenState.tokens.filter(token => {
    return token.pool && token.pool.userContribution && !token.pool.userContribution.isZero()
  })

  filteredTokens.sort((a,b) => {
    let beforeContribution = a.pool?.userContribution ?? new BigNumber(0)
    let afterContribution = b.pool?.userContribution ?? new BigNumber(0)
    return beforeContribution.isLessThan(afterContribution) ? 1 : -1
  })

  return (
    <>
      <div className="font-semibold text-xl mt-8">Pools</div>
      <div className="scrollable-table-container max-w-full overflow-x-scroll">
        <table className="zilstream-table table-fixed border-collapse">
          <colgroup>
            <col style={{width: '200px', minWidth: 'auto'}} />
            <col style={{width: '140px', minWidth: 'auto'}} />
            <col style={{width: '100px', minWidth: 'auto'}} />
            <col style={{width: '100px', minWidth: 'auto'}} />
            <col style={{width: '140px', minWidth: 'auto'}} />
            <col style={{width: '100px', minWidth: 'auto'}} />
          </colgroup>
          <thead className="text-gray-500 dark:text-gray-400 text-xs">
            <tr>
              <th className="pl-4 pr-2 py-2 text-left">Pair</th>
              <th className="px-2 py-2 text-right">Pool</th>
              <th className="px-2 py-2 text-right">{selectedCurrency.code}</th>
              <th className="px-2 py-2 text-right">Fees (24h)</th>
              <th className="px-2 py-2 text-right">Rewards</th>
              <th className="px-2 py-2 text-right">Share</th>
            </tr>
          </thead>
          <tbody>
            {filteredTokens.map((token, index) => {
              let pool = token.pool!
              let contributionPercentage = pool.userContribution!.dividedBy(pool.totalContribution).times(100)
              let contributionShare = contributionPercentage.shiftedBy(-2)
              let tokenAmount = contributionShare?.times(token.pool?.tokenReserve ?? BIG_ZERO);
              let zilAmount = contributionShare?.times(token.pool?.zilReserve ?? BIG_ZERO);

              return (
                <tr key={index} role="row" className="text-sm border-b dark:border-gray-700 last:border-b-0">
                  <td className={`pl-4 pr-2 py-2 font-medium whitespace-nowrap ${index === 0 ? 'rounded-tl-lg' : ''} ${index === filteredTokens.length-1 ? 'rounded-bl-lg' : ''}`}>
                    <div className="flex items-center">
                      <div className="flex items-center mr-3">
                        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full p-1 flex-shrink-0 flex-grow-0 z-20">
                          <TokenIcon url={token.icon} />
                        </div>
                        <div className="w-6 h-6 -ml-2 bg-gray-200 dark:bg-gray-600 rounded-full p-1 flex-shrink-0 flex-grow-0 z-10">
                          <TokenIcon url={`https://meta.viewblock.io/ZIL/logo`} />
                        </div>
                      </div>
                      <span className="font-semibold">{token.symbol} / ZIL</span>
                    </div>
                  </td>
                  <td className="px-2 py-2 font-normal text-right whitespace-nowrap">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium mr-2">{token.symbol}</span>
                      {moneyFormat(tokenAmount, {
                        symbol: token.symbol,
                        compression: token.decimals,
                        maxFractionDigits: 2,
                        showCurrency: false,
                      })}
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 font-medium mr-2">ZIL</span>
                      {moneyFormat(zilAmount, {
                        symbol: 'ZIL',
                        compression: 12,
                        maxFractionDigits: 2,
                        showCurrency: false,
                      })} 
                    </div>
                  </td>
                  <td className="px-2 py-2 font-normal text-right">
                    {currencyFormat(zilAmount.times(2).shiftedBy(-12).times(selectedCurrency.rate).toNumber(), selectedCurrency.symbol)}
                  </td>
                  <td className="px-2 py-2 font-normal text-right">
                    {membership.isMember ? (
                      <>
                        {currencyFormat(toBigNumber(token.daily_volume).times(0.003).times(selectedCurrency.rate).times(contributionShare).toNumber(), selectedCurrency.symbol)}
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm"><Link href="/membership">Membership</Link></span>
                    )}
                  </td>
                  <td className="px-2 py-2 font-normal text-right">
                    {membership.isMember ? (
                      <>
                        {token.rewards.map(reward => {
                          let contributionPercentage = (reward.adjusted_total_contributed !== null) ? 
                            pool.userContribution!.dividedBy(toBigNumber(reward.adjusted_total_contributed)).times(100) :
                            pool.userContribution!.dividedBy(pool.totalContribution).times(100)
                          let contributionShare = contributionPercentage.shiftedBy(-2)
                          let newReward = toBigNumber(reward.amount).times(contributionShare)
                    
                          if(reward.max_individual_amount > 0 && newReward.isGreaterThan(reward.max_individual_amount)) {
                            newReward = toBigNumber(reward.max_individual_amount)
                          }

                          return (
                            <div className="flex items-center justify-end">
                              <span className="w-4 h-4 mr-2"><TokenIcon address={reward.reward_token_address} /></span>
                              <span className="mr-1">{moneyFormat(newReward, {compression: 0, maxFractionDigits: 2})}</span>
                              <span className="font-medium">{reward.reward_token_symbol}</span>
                            </div>
                          )
                        })}
                      </>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm"><Link href="/membership">Membership</Link></span>
                    )}
                      
                  </td>
                  <td className={`px-2 py-2 font-normal text-right ${index === 0 ? 'rounded-tr-lg' : ''} ${index === filteredTokens.length-1 ? 'rounded-br-lg' : ''}`}>
                    {moneyFormat(contributionPercentage, {
                      symbol: '0',
                      compression: 0,
                      maxFractionDigits: 3,
                      showCurrency: false,
                    })}%
                  </td>
                </tr>
              )
            })}
            
          </tbody>
        </table>
        {filteredTokens.length === 0 &&
          <EmptyRow message="Currently not providing liquidity." />
        }
      </div>
    </>
  )
}

export default PortfolioPools