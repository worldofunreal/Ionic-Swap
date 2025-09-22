<template>
  <div class="h-full bg-zinc-50 dark:bg-zinc-900 overflow-hidden">
    <!-- Liquidity Header -->
    <div
      class="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex-shrink-0"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <div
              class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm"
            >
              💧
            </div>
            <div>
              <div class="font-semibold text-zinc-900 dark:text-white">
                Liquidity Pools
              </div>
              <div class="text-sm text-zinc-500 dark:text-zinc-400">
                Stake tokens and earn trading fees
              </div>
            </div>
          </div>

          <!-- System Stats -->
          <div class="flex items-center space-x-6 ml-8">
            <div class="text-center">
              <div class="text-xl font-bold text-purple-600 dark:text-purple-400">
                {{ formatSystemStats.totalStaked }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">Total TVL</div>
            </div>
            <!-- Voting Power - Temporarily disabled, needs rework for proper display -->
            <!-- <div class="text-center">
              <div class="text-xl font-bold text-zinc-900 dark:text-white">
                {{ formatSystemStats.totalVotingPower }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">Voting Power</div>
            </div> -->
            <div class="text-center">
              <div class="text-xl font-bold text-green-600 dark:text-green-400">
                {{ formatSystemStats.totalFees }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400">Fee Earnings</div>
            </div>
          </div>
        </div>

        <!-- Refresh Button -->
        <div class="flex items-center space-x-2">
          <button
            @click="refreshData"
            :disabled="loading"
            class="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
          >
            <UIcon 
              :name="loading ? 'i-heroicons-arrow-path' : 'i-heroicons-arrow-path'" 
              :class="loading ? 'animate-spin' : ''"
              class="w-4 h-4"
            />
          </button>
        </div>
      </div>
    </div>

    <div class="flex h-full min-h-0">
      <!-- Left Column - Pool List -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Pool Controls -->
        <div
          class="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex-shrink-0"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <button
                v-for="tab in poolTabs"
                :key="tab.value"
                :class="[
                  'px-3 py-1 text-sm rounded-md transition-colors',
                  activePoolTab === tab.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600',
                ]"
                @click="activePoolTab = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-sm text-zinc-500 dark:text-zinc-400">
                {{ allPools.length }} pools available
              </span>
            </div>
          </div>
        </div>

        <!-- Pool List -->
        <div class="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-y-auto overflow-x-hidden min-h-0">
          <!-- Loading State -->
          <div v-if="loading && allPools.length === 0" class="p-8 text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-zinc-400" />
            <p class="text-zinc-500 dark:text-zinc-400">Loading liquidity pools...</p>
          </div>

          <!-- Pool Cards -->
          <div v-else class="p-4 space-y-4">
            <div
              v-for="pool in filteredPools"
              :key="pool.token_symbol"
              :class="[
                'border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 cursor-pointer transition-all',
                selectedPool?.token_symbol === pool.token_symbol
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800',
              ]"
              @click="selectPool(pool)"
            >
              <div class="grid grid-cols-12 gap-1 items-center">
                <!-- Token Info - Fixed Width -->
                <div class="col-span-2 flex items-center space-x-2">
                  <img :src="TokenService.getTokenIcon(pool.token_symbol)" :alt="`${pool.token_symbol} icon`" class="w-8 h-8" />
                  <div>
                    <div class="font-semibold text-zinc-900 dark:text-white text-sm">
                      {{ pool.token_symbol }}
                    </div>
                    <div class="text-xs text-zinc-500 dark:text-zinc-400">
                      {{ TokenService.getTokenName(pool.token_symbol) }}
                    </div>
                  </div>
                </div>

                <!-- TVL USDT - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {{ formatUSDTValue(pool.tvl_usdt) }}
                  </div>
                  <div class="text-xs text-zinc-500 dark:text-zinc-400">TVL</div>
                </div>

                <!-- Total Staked - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-zinc-900 dark:text-white">
                    {{ TokenService.formatLargeAmount(pool.total_staked, pool.token_symbol) }}
                  </div>
                  <div class="text-xs text-zinc-500 dark:text-zinc-400">Total Staked</div>
                </div>

                <!-- Available - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {{ TokenService.formatLargeAmount(pool.available_liquidity, pool.token_symbol) }}
                  </div>
                  <div class="text-xs text-zinc-500 dark:text-zinc-400">Liquidity Available</div>
                </div>

                <!-- Fee Earnings (Token) - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-green-600 dark:text-green-400">
                    {{ TokenService.formatLargeAmount(pool.total_fees_collected, pool.token_symbol) }}
                  </div>
                  <div class="text-xs text-zinc-500 dark:text-zinc-400">Fee Earnings</div>
                </div>

                <!-- Status - Fixed Width -->
                <div class="col-span-2 flex flex-col items-center space-y-1">
                  <div 
                    :class="[
                      'px-2 py-1 text-xs rounded-full',
                      getPoolStatusClass(pool.liquidity_status)
                    ]"
                  >
                    {{ formatPoolStatus(pool.liquidity_status) }}
                  </div>
                  <div v-if="pool.current_volatility_1h > 0.05" class="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                    High Vol
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column - Pool Details & Actions -->
      <div
        class="w-96 bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col min-h-0"
      >
        <!-- Pool Details Tabs -->
        <div class="flex border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <button
            v-for="tab in detailTabs"
            :key="tab.value"
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeDetailTab === tab.value
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300',
            ]"
            @click="activeDetailTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Pool Details Content -->
        <div class="flex-1 p-4 overflow-y-auto overflow-x-hidden min-h-0">
          <!-- No Pool Selected -->
          <div v-if="!selectedPool" class="text-center py-8">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
            <h4 class="text-lg font-medium text-foreground mb-2">Select a Pool</h4>
            <p class="text-zinc-500 dark:text-zinc-400">
              Choose a liquidity pool to view details and manage your positions.
            </p>
          </div>

          <!-- Pool Overview Tab -->
          <div v-else-if="activeDetailTab === 'overview'" class="space-y-6">
            <!-- Pool Info -->
            <div class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-4">
                <img :src="TokenService.getTokenIcon(selectedPool.token_symbol)" :alt="`${selectedPool.token_symbol} icon`" class="w-12 h-12" />
                <div>
                  <h3 class="text-lg font-semibold text-foreground">{{ selectedPool.token_symbol }} Pool</h3>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ TokenService.getTokenName(selectedPool.token_symbol) }}</p>
                </div>
              </div>

              <!-- Pool Stats Grid -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Total Staked</div>
                  <div class="font-semibold text-foreground">
                    {{ TokenService.formatLargeAmount(selectedPool.total_staked, selectedPool.token_symbol) }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Available Liquidity</div>
                  <div class="font-semibold text-foreground">
                    {{ TokenService.formatLargeAmount(selectedPool.available_liquidity, selectedPool.token_symbol) }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Total Voting Power</div>
                  <div class="font-semibold text-foreground">{{ selectedPool.total_voting_power.toFixed(2) }}</div>
                </div>
                <div>
                  <div class="text-sm text-zinc-500 dark:text-zinc-400">Fees Collected</div>
                  <div class="font-semibold text-green-600 dark:text-green-400">
                    {{ TokenService.formatLargeAmount(selectedPool.total_fees_collected, selectedPool.token_symbol) }}
                  </div>
                  <div class="text-xs text-green-500 dark:text-green-400">
                    {{ formatUSDTValue(selectedPool.total_fees_collected_usdt) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Fee Breakdown -->
            <div class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Fee Breakdown (24h)</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Trading Fees</span>
                  <div class="text-right">
                    <div class="font-semibold text-foreground">
                      {{ formatPoolFees(selectedPool.fees_from_trading, selectedPool.token_symbol) }}
                    </div>
                    <div class="text-xs text-green-500 dark:text-green-400">
                      ${{ formatUSDTValue(selectedPool.fees_from_trading_usdt) }}
                    </div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Spread Fees</span>
                  <div class="text-right">
                    <div class="font-semibold text-foreground">
                      {{ formatPoolFees(selectedPool.fees_from_spread, selectedPool.token_symbol) }}
                    </div>
                    <div class="text-xs text-green-500 dark:text-green-400">
                      ${{ formatUSDTValue(selectedPool.fees_from_spread_usdt) }}
                    </div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Volatility Penalties</span>
                  <div class="text-right">
                    <div class="font-semibold text-foreground">
                      {{ formatPoolFees(selectedPool.fees_from_volatility, selectedPool.token_symbol) }}
                    </div>
                    <div class="text-xs text-green-500 dark:text-green-400">
                      ${{ formatUSDTValue(selectedPool.fees_from_volatility_usdt) }}
                    </div>
                  </div>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Depth Penalties</span>
                  <div class="text-right">
                    <div class="font-semibold text-foreground">
                      {{ formatPoolFees(selectedPool.fees_from_depth, selectedPool.token_symbol) }}
                    </div>
                    <div class="text-xs text-green-500 dark:text-green-400">
                      ${{ formatUSDTValue(selectedPool.fees_from_depth_usdt) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Current Conditions -->
            <div class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Current Conditions</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Pool Status</span>
                  <span 
                    :class="[
                      'px-2 py-1 text-xs rounded-full',
                      getPoolStatusClass(selectedPool.liquidity_status)
                    ]"
                  >
                    {{ formatPoolStatus(selectedPool.liquidity_status) }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">1h Volatility</span>
                  <span class="font-semibold text-foreground">{{ (selectedPool.current_volatility_1h * 100).toFixed(2) }}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">1h Volume</span>
                  <span class="font-semibold text-foreground">
                    {{ TokenService.formatBalance(typeof selectedPool.total_volume_1h === 'bigint' ? Number(selectedPool.total_volume_1h) : selectedPool.total_volume_1h, selectedPool.token_symbol) }} {{ selectedPool.token_symbol }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Threshold Information -->
            <div class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Liquidity Health</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Available / Total Staked</span>
                  <span class="font-semibold text-foreground">{{ formatLiquidityStats(selectedPool) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Current Ratio</span>
                  <span class="font-semibold text-foreground">{{ formatLiquidityRatio(selectedPool) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Healthy</span>
                  <span class="text-sm text-green-600 dark:text-green-400">≥ {{ formatThresholdAmount(selectedPool, 0.75) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Needs Rebalance</span>
                  <span class="text-sm text-yellow-600 dark:text-yellow-400">{{ formatThresholdAmount(selectedPool, 0.50) }} - {{ formatThresholdAmount(selectedPool, 0.75) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-zinc-500 dark:text-zinc-400">Halted</span>
                  <span class="text-sm text-red-600 dark:text-red-400">< {{ formatThresholdAmount(selectedPool, 0.50) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- My Positions Tab -->
          <div v-else-if="activeDetailTab === 'positions'" class="space-y-4">
            <!-- Loading State -->
            <div v-if="positionsLoading" class="text-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-zinc-400" />
              <p class="text-zinc-500 dark:text-zinc-400">Loading positions...</p>
            </div>

            <!-- No Positions -->
            <div v-else-if="userPositions.length === 0" class="text-center py-8">
              <UIcon name="i-heroicons-banknotes" class="w-12 h-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
              <h4 class="text-lg font-medium text-foreground mb-2">No Positions</h4>
              <p class="text-zinc-500 dark:text-zinc-400 mb-4">
                You don't have any liquidity positions yet.
              </p>
              <button
                @click="activeDetailTab = 'stake'"
                class="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Start Staking
              </button>
            </div>

            <!-- Position List -->
            <div v-else class="space-y-3">
              <div
                v-for="position in userPositions"
                :key="position.id"
                class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-2">
                    <img :src="TokenService.getTokenIcon(position.token_symbol)" :alt="`${position.token_symbol} icon`" class="w-8 h-8" />
                    <div>
                      <div class="font-semibold text-foreground">{{ position.token_symbol }}</div>
                      <div class="text-xs text-zinc-500 dark:text-zinc-400">ID: {{ position.id.slice(-8) }}</div>
                    </div>
                  </div>
                  <div 
                    :class="[
                      'px-2 py-1 text-xs rounded-full',
                      getNeuronStateClass(position.state)
                    ]"
                  >
                    {{ formatNeuronState(position.state) }}
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div class="text-zinc-500 dark:text-zinc-400">Staked Amount</div>
                    <div class="font-semibold text-foreground">
                      {{ TokenService.formatBalance(typeof position.staked_amount === 'bigint' ? Number(position.staked_amount) : position.staked_amount, position.token_symbol) }} {{ position.token_symbol }}
                    </div>
                  </div>
                  <div>
                    <div class="text-zinc-500 dark:text-zinc-400">Dissolve Delay</div>
                    <div class="font-semibold text-foreground">{{ formatDuration(position.dissolve_delay_seconds) }}</div>
                  </div>
                  <div>
                    <div class="text-zinc-500 dark:text-zinc-400">Age</div>
                    <div class="font-semibold text-foreground">{{ formatAge(position.created_at) }}</div>
                  </div>
                  <div>
                    <div class="text-zinc-500 dark:text-zinc-400">Voting Power</div>
                    <div class="font-semibold text-foreground">{{ calculateVotingPower(position).toFixed(2) }}</div>
                    <div class="text-xs text-zinc-400 dark:text-zinc-500">
                      {{ calculateVotingPowerPercentage(position, selectedPool).toFixed(2) }}% of pool
                    </div>
                  </div>
                  <div>
                    <div class="text-zinc-500 dark:text-zinc-400">Claimable Fees</div>
                    <div class="font-semibold text-foreground">
                      {{ calculateClaimableFees(position).toFixed(6) }} {{ position.token_symbol }}
                    </div>
                    <div class="text-xs text-zinc-400 dark:text-zinc-500">
                      ≈ ${{ (calculateClaimableFees(position) * getPositionPrice(position)).toFixed(2) }}
                    </div>
                  </div>
                  
                  <!-- Dissolving-specific information -->
                  <div v-if="position.state.Dissolving">
                    <div class="text-zinc-500 dark:text-zinc-400">Dissolving Progress</div>
                    <div class="font-semibold text-foreground">
                      {{ calculateDissolvingProgress(position).toFixed(1) }}%
                    </div>
                    <div class="w-full bg-zinc-200 rounded-full h-2 mt-1">
                      <div 
                        class="bg-yellow-500 h-2 rounded-full transition-all duration-300" 
                        :style="{ width: calculateDissolvingProgress(position) + '%' }"
                      ></div>
                    </div>
                  </div>
                  
                  <div v-if="position.state.Dissolving">
                    <div class="text-zinc-500 dark:text-zinc-400">Time Remaining</div>
                    <div class="font-semibold text-foreground">
                      {{ formatTimeRemaining(position) }}
                    </div>
                  </div>
                  
                  <div v-if="position.state.Dissolving || position.state.Dissolved">
                    <div class="text-zinc-500 dark:text-zinc-400">Available to Withdraw</div>
                    <div class="font-semibold text-green-600 dark:text-green-400">
                      {{ formatAvailableWithdrawal(position) }}
                    </div>
                    <div class="text-xs text-green-500 dark:text-green-400">
                      ≈ ${{ (calculateAvailableWithdrawal(position) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol)) * getPositionPrice(position)).toFixed(2) }}
                    </div>
                  </div>
                  
                  <div v-if="position.state.Dissolving">
                    <div class="text-zinc-500 dark:text-zinc-400">Still Locked (Earning Fees)</div>
                    <div class="font-semibold text-primary-600 dark:text-primary-400">
                      {{ formatLockedAmount(position) }}
                    </div>
                  </div>
                </div>

                <!-- Position Actions -->
                <div class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <div class="flex flex-col space-y-2">
                    <!-- Primary Actions Row -->
                    <div class="flex space-x-2">
                      <!-- Unstake Button (Start Dissolving) -->
                      <button
                        v-if="position.state.Locked"
                        @click="showDissolveConfirm[position.id] = true"
                        class="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        Unstake
                      </button>
                      
                      <!-- Cancel Dissolving Button -->
                      <button
                        v-if="position.state.Dissolving"
                        @click="stopDissolving(position)"
                        class="flex-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        Cancel Dissolving
                      </button>
                      
                      <!-- Add More Button -->
                      <button
                        v-if="position.state.Locked"
                        @click="showAddStake[position.id] = !showAddStake[position.id]"
                        class="flex-1 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        {{ showAddStake[position.id] ? 'Cancel' : 'Add More' }}
                      </button>
                      
                      <!-- Claim/Compound Fees Buttons -->
                      <button
                        v-if="position.state.Locked && calculateClaimableFees(position) > 0"
                        @click="compoundFees(position)"
                        :disabled="compoundingPositions.includes(position.id)"
                        class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center"
                      >
                        <div v-if="compoundingPositions.includes(position.id)" class="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin"></div>
                        {{ compoundingPositions.includes(position.id) ? 'Compounding...' : 'Compound' }}
                      </button>
                      
                      <button
                        @click="claimFees(position)"
                        :disabled="claimingFees === position.id"
                        class="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center"
                      >
                        <div v-if="claimingFees === position.id" class="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin"></div>
                        {{ claimingFees === position.id ? 'Claiming...' : 'Claim Fees' }}
                      </button>
                    </div>
                    
                    <!-- Add Stake Section -->
                    <div v-if="showAddStake[position.id]" class="bg-primary-50 dark:bg-primary-900/20 rounded-md p-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-primary-700 dark:text-primary-300">Add More {{ position.token_symbol }}</span>
                        <span class="text-xs text-primary-600 dark:text-primary-400">
                          Balance: {{ formatUserBalance(position.token_symbol) }}
                        </span>
                      </div>
                      
                      <div class="flex space-x-2">
                        <input
                          v-model="addStakeAmounts[position.id]"
                          type="text"
                          placeholder="0.00"
                          class="flex-1 px-2 py-1 text-xs bg-white dark:bg-zinc-800 border border-primary-200 dark:border-primary-700 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                        <button
                          @click="setMaxAddStake(position)"
                          class="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 rounded hover:bg-primary-200 dark:hover:bg-primary-700"
                        >
                          Max
                        </button>
                        <button
                          @click="addToPosition(position)"
                          :disabled="addingToPositions.includes(position.id)"
                          class="px-3 py-1 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white text-xs font-semibold rounded transition-colors flex items-center"
                        >
                          <div v-if="addingToPositions.includes(position.id)" class="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin"></div>
                          {{ addingToPositions.includes(position.id) ? 'Adding...' : 'Add' }}
                        </button>
                      </div>
                    </div>
                    
                    <!-- Single Withdraw (withdraw available) -->
                    <div v-if="(position.state.Dissolving || position.state.Dissolved) && calculateAvailableWithdrawal(position) > 0" class="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
                      <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium text-green-700 dark:text-green-300">Available to Withdraw</span>
                        <span class="text-xs text-green-600 dark:text-green-400">
                          {{ formatAvailableWithdrawal(position) }}
                        </span>
                      </div>
                      <button
                        @click="withdrawPosition(position)"
                        :disabled="withdrawingPositions.includes(position.id)"
                        class="w-full px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center"
                      >
                        <div v-if="withdrawingPositions.includes(position.id)" class="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin"></div>
                        {{ withdrawingPositions.includes(position.id) ? 'Withdrawing...' : 'Withdraw Available' }}
                      </button>
                    </div>
                    
                    <!-- Full Withdrawal Button (for Dissolved positions) -->
                    <button
                      v-if="position.state.Dissolved"
                      @click="withdrawPosition(position)"
                      :disabled="withdrawingPositions.includes(position.id)"
                      class="w-full px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-400 text-white text-xs font-semibold rounded-md transition-colors flex items-center justify-center"
                    >
                      <div v-if="withdrawingPositions.includes(position.id)" class="w-3 h-3 mr-1 border border-white border-t-transparent rounded-full animate-spin"></div>
                      {{ withdrawingPositions.includes(position.id) ? 'Withdrawing...' : 'Withdraw All' }}
                    </button>
                  </div>
                </div>

                <!-- Dissolving Confirmation Modal -->
                <div
                  v-if="showDissolveConfirm[position.id]"
                  class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
                >
                  <div class="bg-white dark:bg-zinc-800 rounded-lg shadow-lg w-full max-w-sm p-4">
                    <h4 class="text-sm font-semibold text-foreground mb-2">Confirm Unstake</h4>
                    <ul class="text-xs text-zinc-600 dark:text-zinc-300 space-y-2 mb-4 list-disc pl-4">
                      <li>We will automatically claim your accumulated fees now.</li>
                      <li>Your position will not earn new fees while dissolving.</li>
                      <li>Your displayed voting power will decrease as your stake unlocks.</li>
                      <li>You can cancel dissolving at any time to resume earning fees.</li>
                    </ul>
                    <div class="flex space-x-2">
                      <button
                        @click="showDissolveConfirm[position.id] = false"
                        class="flex-1 px-3 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-100 text-xs font-semibold rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        @click="confirmStartDissolving(position)"
                        :disabled="dissolvingPositions.includes(position.id)"
                        class="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-400 text-white text-xs font-semibold rounded-md transition-colors"
                      >
                        {{ dissolvingPositions.includes(position.id) ? 'Unstaking...' : 'Continue Unstake' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Stake Tab -->
          <div v-else-if="activeDetailTab === 'stake'" class="space-y-4">
            <!-- Staking Form -->
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-foreground">Stake {{ selectedPool?.token_symbol || 'Tokens' }}</h3>
              
              <!-- Amount Input -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Amount</label>
                  <span class="text-xs text-zinc-500 dark:text-zinc-400">
                    Balance: {{ formatUserBalance(selectedPool?.token_symbol || '') }}
                  </span>
                </div>
                
                <div class="relative">
                  <input
                    v-model="stakeAmount"
                    type="text"
                    placeholder="0.00"
                    @input="formatStakeAmount"
                    @blur="validateStakeAmount"
                    class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                  <div class="absolute left-3 top-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {{ selectedPool?.token_symbol || 'TOKEN' }}
                  </div>
                </div>

                <!-- Percentage Buttons -->
                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600"
                    @click="setStakeAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>

              <!-- Dissolve Delay -->
              <div class="space-y-2">
                <label class="text-sm font-medium text-zinc-700 dark:text-zinc-300">Dissolve Delay</label>
                <select
                  v-model="selectedDissolveDelay"
                  class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option v-for="option in dissolveDelayOptions" :key="option.value" :value="option.value">
                    {{ option.label }} ({{ option.multiplier }}x voting power)
                  </option>
                </select>
              </div>

              <!-- Stake Preview -->
              <div class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <h4 class="font-medium text-foreground mb-2">Staking Preview</h4>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-zinc-500 dark:text-zinc-400">Amount to Stake</span>
                    <span class="font-semibold text-foreground">{{ stakeAmount || '0.00' }} {{ selectedPool?.token_symbol || 'TOKEN' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500 dark:text-zinc-400">Dissolve Delay</span>
                    <span class="font-semibold text-foreground">{{ formatDuration(selectedDissolveDelay) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-zinc-500 dark:text-zinc-400">Expected Voting Power</span>
                    <span class="font-semibold text-foreground">{{ calculateExpectedVotingPower().toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Stake Button -->
              <button
                @click="executeStake"
                :disabled="stakeLoading || !stakeAmount || parseFormattedNumber(stakeAmount) <= 0"
                class="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center"
              >
                <UIcon v-if="stakeLoading" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ stakeLoading ? 'Staking...' : 'Stake Tokens' }}
              </button>

              <!-- Info Note -->
              <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-3">
                <div class="flex items-start">
                  <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div class="text-sm text-primary-700 dark:text-primary-300">
                    <p class="font-medium mb-1">Staking Information</p>
                    <p>Your staked tokens will earn fees from trading activity. Longer dissolve delays provide higher voting power and fee earnings. You can claim accumulated fees at any time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Analytics Tab -->
          <div v-else-if="activeDetailTab === 'analytics'" class="space-y-4">
            <h3 class="text-lg font-semibold text-foreground">Pool Analytics</h3>
            
            <!-- Coming Soon Notice -->
            <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div class="flex items-start">
                <UIcon name="i-heroicons-chart-bar" class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h4 class="text-sm font-medium text-amber-800 dark:text-amber-200">Analytics Coming Soon</h4>
                  <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Detailed analytics including fee charts, APY calculations, and historical performance will be available soon.
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Basic Stats for now -->
            <div v-if="selectedPool" class="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Quick Stats</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-zinc-500 dark:text-zinc-400">Pool Utilization</span>
                  <span class="font-semibold text-foreground">{{ getPoolUtilization(selectedPool).toFixed(1) }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-zinc-500 dark:text-zinc-400">Fee Index</span>
                  <span class="font-semibold text-foreground">{{ selectedPool.global_fee_index.toFixed(6) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onActivated, onUnmounted, watch } from 'vue'
  import { canisterService } from '@/services/CanisterService'
  import { useAuthStore } from '@/stores/auth'
  import { TokenService } from '@/services/TokenService'

  // Stores
  const auth = useAuthStore()
  const toast = useToast()

  // Reactive data
  const loading = ref(true)
  const positionsLoading = ref(false)
  const stakeLoading = ref(false)
  const activePoolTab = ref('all')
  const activeDetailTab = ref('overview')
  const selectedPool = ref<any>(null)

  // Data
  const allPools = ref<any[]>([])
  const userPositions = ref<any[]>([])
  const systemStats = ref({ totalStaked: 0, totalVotingPower: 0, totalFees: 0, totalPools: 0, totalPositions: 0 })
  const canisterServiceReady = ref(false)
  const userBalances = ref<Record<string, number>>({})

  // Staking form
  const stakeAmount = ref('')
  const selectedDissolveDelay = ref(30 * 24 * 3600) // 30 days default
  
  // Loading states for different actions
  const claimingFees = ref<string | null>(null) // Track which position ID is claiming fees
  const dissolvingPositions = ref<string[]>([])
  const withdrawingPositions = ref<string[]>([])
  const addingToPositions = ref<string[]>([])
  const compoundingPositions = ref<string[]>([])
  
  // UI state
  const addStakeAmounts = ref<Record<string, string>>({})
  const showAddStake = ref<Record<string, boolean>>({})
  const showDissolveConfirm = ref<Record<string, boolean>>({})

  // Pool tabs
  const poolTabs = [
    { label: 'All Pools', value: 'all' },
    { label: 'My Pools', value: 'mine' },
    { label: 'High APY', value: 'high_apy' },
  ]

  // Detail tabs
  const detailTabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'My Positions', value: 'positions' },
    { label: 'Stake', value: 'stake' },
    { label: 'Analytics', value: 'analytics' },
  ]

  // Dissolve delay options with multipliers (simplified)
  const dissolveDelayOptions = [
    { label: '1 Day', value: 24 * 3600, multiplier: '1.0' },
    { label: '1 Week', value: 7 * 24 * 3600, multiplier: '1.1' },
    { label: '30 Days', value: 30 * 24 * 3600, multiplier: '1.5' },
    { label: '90 Days', value: 90 * 24 * 3600, multiplier: '2.0' },
    { label: '180 Days', value: 180 * 24 * 3600, multiplier: '3.0' },
    { label: '1 Year', value: 365 * 24 * 3600, multiplier: '4.0' },
  ]

  // Computed properties
  const filteredPools = computed(() => {
    if (activePoolTab.value === 'mine') {
      const userTokens = new Set(userPositions.value.map(p => p.token_symbol))
      return allPools.value.filter(pool => userTokens.has(pool.token_symbol))
    }
    if (activePoolTab.value === 'high_apy') {
      return allPools.value.sort((a, b) => b.total_fees_collected - a.total_fees_collected)
    }
    return allPools.value
  })

  const formatSystemStats = computed(() => ({
    totalStaked: TokenService.formatLargeUSD(systemStats.value.totalStaked),
    totalVotingPower: systemStats.value.totalVotingPower.toFixed(0),
    totalFees: TokenService.formatLargeUSD(systemStats.value.totalFees),
  }))

  // Helper functions

  const formatPoolFees = (fees: number | bigint, symbol: string) => {
    const feesNum = Number(fees)
    const decimals = TokenService.getTokenDecimals(symbol)
    const formattedFees = feesNum / Math.pow(10, decimals)
    
    if (symbol === 'USDT') {
      return TokenService.formatCurrency(formattedFees)
    }
    
    // Format with token symbol for clarity
    return `${TokenService.formatBalance(feesNum, symbol)} ${symbol}`
  }

  const formatUSDTValue = (value: number[] | null | undefined) => {
    // Handle Candid optional values: [] means None, [number] means Some(number)
    let actualValue: number | null | undefined = null
    
    if (Array.isArray(value)) {
      if (value.length === 1) {
        actualValue = value[0]
      }
      // If array is empty ([]), actualValue remains null
    } else if (typeof value === 'number') {
      // Fallback for direct number values
      actualValue = value
    }
    
    // Handle null, undefined, or non-numeric values
    if (actualValue === null || actualValue === undefined || typeof actualValue !== 'number' || isNaN(actualValue)) {
      return '$0.00'
    }
    
    return TokenService.formatLargeUSD(actualValue)
  }


  const formatPoolStatus = (status: any) => {
    if (!status) return 'Unknown'
    if (status.Healthy !== undefined) return 'Healthy'
    if (status.NeedsRebalance !== undefined) return 'Needs Rebalance'
    if (status.Critical !== undefined) return 'Critical'
    if (status.Halted !== undefined) return 'Halted'
    return 'Unknown'
  }

  const getPoolStatusClass = (status: any) => {
    if (!status) return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
    if (status.Healthy !== undefined) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (status.NeedsRebalance !== undefined) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (status.Critical !== undefined) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    if (status.Halted !== undefined) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
  }

  const formatNeuronState = (state: any) => {
    // Handle Candid enum format: {Locked: null}, {Dissolving: null}, etc.
    if (state && typeof state === 'object') {
      if ('Locked' in state) return 'Locked'
      if ('Dissolving' in state) return 'Dissolving'
      if ('Dissolved' in state) return 'Dissolved'
    }
    // Fallback for direct string values
    if (state === 'Locked') return 'Locked'
    if (state === 'Dissolving') return 'Dissolving'
    if (state === 'Dissolved') return 'Dissolved'
    return 'Unknown'
  }

  const getNeuronStateClass = (state: any) => {
    if (state.Locked) return 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
    if (state.Dissolving) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (state.Dissolved) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200'
  }

  const formatDuration = (seconds: number | bigint) => {
    const secondsNum = typeof seconds === 'bigint' ? Number(seconds) : seconds
    const days = Math.floor(secondsNum / (24 * 3600))
    if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) !== 1 ? 's' : ''}`
    if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''}`
    if (days >= 7) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`
    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`
    const hours = Math.floor(secondsNum / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''}`
  }

  const formatAge = (timestamp: number | bigint) => {
    const now = Date.now() / 1000
    const age = now - Number(timestamp)
    return formatDuration(age)
  }

  const calculateVotingPower = (position: any) => {
    // Use locked_amount if available (accounts for dissolving state), otherwise fallback to staked_amount
    const lockedAmount = position.locked_amount || position.staked_amount
    
    // Convert to display amount
    const stakeAmount = Number(lockedAmount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
    
    // Delay multiplier: exactly match backend formula
    const delay_days = Number(position.dissolve_delay_seconds) / (24 * 3600)
    const delayMultiplier = Math.min(4.0, 1.0 + (delay_days / 365.0) * 3.0)
    
    // Age multiplier: use current_age_seconds if available, otherwise calculate
    let age_seconds
    if (position.current_age_seconds) {
      age_seconds = Number(position.current_age_seconds)
    } else {
      // Fallback calculation (less accurate but better than nothing)
      age_seconds = (Date.now() / 1000) - Number(position.created_at)
    }
    const age_years = age_seconds / (365 * 24 * 3600)
    const ageMultiplier = Math.min(1.5, 1.0 + (age_years / 4.0) * 0.5)
    
    const votingPower = stakeAmount * delayMultiplier * ageMultiplier
    
    // Debug logging
    console.log(`🔍 Voting Power Calculation for ${position.token_symbol}:`, {
      lockedAmount,
      stakeAmount,
      delay_days,
      delayMultiplier,
      age_seconds,
      age_years,
      ageMultiplier,
      finalVotingPower: votingPower
    })
    
    return votingPower
  }

  const calculateVotingPowerPercentage = (position: any, pool: any) => {
    const positionVP = calculateVotingPower(position)
    
    // Normalize pool's total voting power to match frontend scale
    const poolDecimals = TokenService.getTokenDecimals(position.token_symbol)
    const normalizedPoolVP = (pool?.total_voting_power || 0) / Math.pow(10, poolDecimals)
    
    if (normalizedPoolVP === 0) return 0
    return (positionVP / normalizedPoolVP) * 100
  }

  const calculateClaimableFees = (position: any) => {
    // Do not show claimable fees while dissolving or dissolved
    if (position.state?.Dissolving || position.state?.Dissolved) return 0
    // Find the correct pool for this specific position
    const pool = allPools.value.find(p => p.token_symbol === position.token_symbol)
    if (!pool) return 0
    
    // Calculate raw voting power (in token's smallest units) for fee calculation
    const stakeAmount = Number(position.staked_amount)
    const delayMultiplier = Math.min(4.0, 1.0 + (Number(position.dissolve_delay_seconds) / (365 * 24 * 3600)) * 3.0)
    const age = (Date.now() / 1000) - Number(position.created_at)
    const ageMultiplier = Math.min(1.5, 1.0 + (age / (4 * 365 * 24 * 3600)) * 0.5)
    const rawVotingPower = stakeAmount * delayMultiplier * ageMultiplier
    
    const feeIndexDifference = pool.global_fee_index - (position.last_fee_index || 0)
    const claimableFeesRaw = feeIndexDifference * rawVotingPower
    
    // Debug logging
    console.log(`🔍 Fee calculation for position ${position.id} (${position.token_symbol}):`, {
      stakeAmount,
      rawVotingPower,
      globalFeeIndex: pool.global_fee_index,
      lastFeeIndex: position.last_fee_index || 0,
      feeIndexDifference,
      claimableFeesRaw,
      decimals: TokenService.getTokenDecimals(position.token_symbol),
      finalAmount: claimableFeesRaw / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
    })
    
    return claimableFeesRaw / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
  }

  const calculateExpectedVotingPower = () => {
    if (!stakeAmount.value || !selectedPool.value) return 0
    const amount = parseFormattedNumber(stakeAmount.value)
    const delayMultiplier = Math.min(4.0, 1.0 + (selectedDissolveDelay.value / (365 * 24 * 3600)) * 3.0)
    return amount * delayMultiplier
  }

  const getPoolUtilization = (pool: any) => {
    const totalStaked = Number(pool.total_staked)
    const availableLiquidity = Number(pool.available_liquidity)
    if (totalStaked === 0) return 0
    return ((totalStaked - availableLiquidity) / totalStaked) * 100
  }

  const getPositionPrice = (position: any) => {
    const pool = allPools.value.find(p => p.token_symbol === position.token_symbol)
    return pool?.current_price_usdt?.[0] || 0
  }

  const formatUserBalance = (symbol: string) => {
    if (!auth.userProfile?.id || !canisterServiceReady.value) return '0.00'
    
    const balance = userBalances.value[symbol]
    if (balance === undefined || balance === null) return '0.00'
    
    return TokenService.formatBalance(balance, symbol)
  }

  const formatLiquidityRatio = (pool: any) => {
    if (!pool || pool.total_staked === 0) return '0.0%'
    
    const availableLiquidity = Number(pool.available_liquidity)
    const totalStaked = Number(pool.total_staked)
    const ratio = (availableLiquidity / totalStaked) * 100
    
    return `${ratio.toFixed(1)}%`
  }

  const formatLiquidityStats = (pool: any) => {
    if (!pool) return '0 / 0'
    
    const available = TokenService.formatCompactBalance(pool.available_liquidity, pool.token_symbol)
    const total = TokenService.formatCompactBalance(pool.total_staked, pool.token_symbol)
    
    return `${available} / ${total} ${pool.token_symbol}`
  }

  const formatThresholdAmount = (pool: any, ratio: number) => {
    if (!pool || pool.total_staked === 0) return '0'
    
    const totalStaked = Number(pool.total_staked)
    const thresholdAmount = totalStaked * ratio
    
    return TokenService.formatCompactBalance(thresholdAmount, pool.token_symbol) + ' ' + pool.token_symbol
  }

  // Enhanced dissolving/withdrawal helper functions
  const calculateDissolvingProgress = (position: any) => {
    if (!position.state.Dissolving || !position.dissolving_started_at) return 0
    
    const now = Date.now() / 1000
    const elapsed = now - Number(position.dissolving_started_at)
    const progress = Math.min(elapsed / Number(position.dissolve_delay_seconds), 1.0)
    
    return progress * 100
  }

  const calculateAvailableWithdrawal = (position: any) => {
    if (position.state.Locked) return 0
    if (position.state.Dissolved) {
      const staked = Number(position.staked_amount)
      const withdrawn = Number(position.withdrawn_amount || 0)
      return Math.max(0, staked - withdrawn)
    }
    if (position.state.Dissolving && position.dissolving_started_at) {
      const now = Date.now() / 1000
      const elapsed = now - Number(position.dissolving_started_at)
      const progress = Math.min(elapsed / Number(position.dissolve_delay_seconds), 1.0)
      const totalAvailable = Number(position.staked_amount) * progress
      const withdrawn = Number(position.withdrawn_amount || 0)
      return Math.max(0, totalAvailable - withdrawn)
    }
    return 0
  }

  const calculateLockedAmount = (position: any) => {
    if (position.state.Locked) return Number(position.staked_amount)
    if (position.state.Dissolved) return 0
    if (position.state.Dissolving && position.dissolving_started_at) {
      const now = Date.now() / 1000
      const elapsed = now - Number(position.dissolving_started_at)
      const progress = Math.min(elapsed / Number(position.dissolve_delay_seconds), 1.0)
      return Number(position.staked_amount) * (1 - progress)
    }
    return 0
  }

  const formatTimeRemaining = (position: any) => {
    if (!position.state.Dissolving || !position.dissolving_started_at) return 'N/A'
    
    const now = Date.now() / 1000
    const elapsed = now - Number(position.dissolving_started_at)
    const remaining = Math.max(0, Number(position.dissolve_delay_seconds) - elapsed)
    
    return formatDuration(remaining)
  }

  const formatAvailableWithdrawal = (position: any) => {
    const available = calculateAvailableWithdrawal(position)
    const displayAmount = available / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
    return TokenService.formatBalance(available, position.token_symbol)
  }

  const formatLockedAmount = (position: any) => {
    const locked = calculateLockedAmount(position)
    return TokenService.formatBalance(locked, position.token_symbol)
  }


  // Form helpers
  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '')
    return parseFloat(cleaned) || 0
  }

  const formatNumberWithCommas = (value: number, decimals: number, useFloor: boolean = false): string => {
    if (isNaN(value) || !isFinite(value)) return '0.00'
    
    // Use Math.floor to round down when useFloor is true (for 100% calculations)
    const adjustedValue = useFloor ? Math.floor(value * Math.pow(10, decimals)) / Math.pow(10, decimals) : value
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(adjustedValue)
  }

  const formatStakeAmount = (event: Event) => {
    const target = event.target as HTMLInputElement
    const value = target.value
    const parsed = parseFormattedNumber(value)
    
    if (!isNaN(parsed) && isFinite(parsed) && selectedPool.value) {
      const formatted = formatNumberWithCommas(parsed, TokenService.getDisplayDecimals(selectedPool.value.token_symbol))
      stakeAmount.value = formatted
    }
  }

  const validateStakeAmount = () => {
    // Add validation logic here
  }

  const loadUserBalances = async () => {
    if (!auth.userProfile?.id || !canisterServiceReady.value) return
    
    try {
      const balances = await canisterService.getUserBalances(auth.userProfile.id.toString())
      userBalances.value = balances
    } catch (error) {
      console.error('Error loading user balances:', error)
    }
  }

  const setStakeAmount = (percent: number) => {
    if (!selectedPool.value) return
    
    const symbol = selectedPool.value.token_symbol
    const balance = userBalances.value[symbol]
    
    if (balance === undefined || balance === null) {
      stakeAmount.value = '0.00'
      return
    }
    
    // Convert raw balance to display amount, then calculate percentage
    const balanceRaw = balance / Math.pow(10, TokenService.getTokenDecimals(symbol))
    const amount = (balanceRaw * percent) / 100
    
    // Use floor rounding for 100% to avoid exceeding balance
    const useFloor = percent === 100
    stakeAmount.value = formatNumberWithCommas(amount, TokenService.getDisplayDecimals(symbol), useFloor)
  }

  // Actions
  const selectPool = (pool: any) => {
    selectedPool.value = pool
    loadUserPositions()
    loadUserBalances()
  }

  const refreshData = async () => {
    loading.value = true
    try {
      // Load pools first, then system stats (which depends on pools)
      await loadAllPools()
      await loadSystemStats()
      
      // Load user data in parallel
      await Promise.all([
        loadUserPositions(),
        loadUserBalances()
      ])
    } catch (error) {
      console.error('Error refreshing liquidity data:', error)
    } finally {
      loading.value = false
    }
  }

  const loadAllPools = async () => {
    if (!canisterServiceReady.value) return
    
    try {
      const pools = await canisterService.getAllLiquidityPools()
      allPools.value = pools
      
      // Debug logging to check pool voting power data
      console.log('🔍 Pool Data Debug:', pools.map(p => ({
        token: p.token_symbol,
        totalVotingPower: p.total_voting_power,
        totalStaked: p.total_staked,
        availableLiquidity: p.available_liquidity
      })))
      
      // Auto-select first pool if none selected (URL watcher will handle URL-based selection)
      if (!selectedPool.value && pools.length > 0 && !useRoute().query.token) {
        selectedPool.value = pools[0]
      }
    } catch (error) {
      console.error('Error loading pools:', error)
    }
  }

  const loadSystemStats = async () => {
    if (!canisterServiceReady.value) return
    
    try {
      const stats = await canisterService.getLiquiditySystemStats()
      
      // Calculate actual total voting power from all pools
      const totalVotingPower = allPools.value.reduce((total, pool) => {
        return total + (pool.total_voting_power || 0)
      }, 0)
      
      systemStats.value = {
        totalStaked: Number(stats[2]),      // total_staked_usdt (index 2)
        totalVotingPower: totalVotingPower, // actual total voting power
        totalFees: Number(stats[3]),        // total_fees_usdt (index 3)
        totalPools: Number(stats[1]),       // total_pools (index 1)
        totalPositions: Number(stats[0])    // total_positions (index 0)
      }
      
      // Debug logging
      console.log('🔍 System Stats Debug:', {
        backendStats: stats,
        calculatedVotingPower: totalVotingPower,
        poolVotingPowers: allPools.value.map(p => ({
          token: p.token_symbol,
          votingPower: p.total_voting_power
        }))
      })
    } catch (error) {
      console.error('Error loading system stats:', error)
    }
  }

  const loadUserPositions = async () => {
    if (!auth.userProfile?.id || !canisterServiceReady.value) return
    
    positionsLoading.value = true
    try {
      const positions = await canisterService.getLiquidityPositions(auth.userProfile.id as any)
      
      // Filter positions for selected pool if one is selected AND we're not on "My Positions" tab
      if (selectedPool.value && activeDetailTab.value !== 'positions') {
        userPositions.value = positions.filter(p => p.token_symbol === selectedPool.value.token_symbol)
      } else {
        // Show all positions when on "My Positions" tab or no pool selected
        userPositions.value = positions
      }
    } catch (error) {
      console.error('Error loading user positions:', error)
    } finally {
      positionsLoading.value = false
    }
  }

  const executeStake = async () => {
    if (!selectedPool.value || !stakeAmount.value) {
      toast.add({
        title: 'Invalid Input',
        description: 'Please select a pool and enter an amount',
        color: 'error',
      })
      return
    }

    const parsedAmount = parseFormattedNumber(stakeAmount.value)
    if (parsedAmount <= 0) {
      toast.add({
        title: 'Invalid Amount',
        description: 'Amount must be greater than 0',
        color: 'error',
      })
      return
    }

    // Check if user has sufficient balance
    const symbol = selectedPool.value.token_symbol
    const balance = userBalances.value[symbol]
    if (balance === undefined || balance === null) {
      toast.add({
        title: 'Balance Error',
        description: 'Unable to check your balance',
        color: 'error',
      })
      return
    }

    const balanceRaw = balance / Math.pow(10, TokenService.getTokenDecimals(symbol))
    if (parsedAmount > balanceRaw) {
      toast.add({
        title: 'Insufficient Balance',
        description: `You have ${TokenService.formatBalance(balance, symbol)} but trying to stake ${stakeAmount.value}`,
        color: 'error',
      })
      return
    }

    stakeLoading.value = true
    try {
      // Convert amount to raw format for backend
      const rawAmount = TokenService.toRawAmount(parsedAmount, symbol)
      
      const result = await canisterService.stakeTokens(
        symbol,
        BigInt(rawAmount),
        BigInt(selectedDissolveDelay.value)
      )

      // Success!
      toast.add({
        title: 'Staking Successful!',
        description: result,
        color: 'success',
      })

      // Clear form
      stakeAmount.value = ''

      // Refresh data
      await Promise.all([
        loadUserBalances(),
        loadUserPositions(),
        loadAllPools(),
        loadSystemStats()
      ])

    } catch (error) {
      console.error('Staking error:', error)
      toast.add({
        title: 'Staking Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    } finally {
      stakeLoading.value = false
    }
  }

  const startDissolving = async (position: any) => {
    if (!canisterServiceReady.value) return
    
    dissolvingPositions.value.push(position.id)
    
    try {
      const result = await canisterService.startDissolving(position.id)
      
      toast.add({
        title: 'Unstaking Started!',
        description: result,
        color: 'success',
      })
      
      // Refresh positions to get updated state
      await Promise.all([loadUserPositions(), loadUserBalances()])
      
    } catch (error) {
      console.error('Error starting dissolving:', error)
      toast.add({
        title: 'Unstaking Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    } finally {
      dissolvingPositions.value = dissolvingPositions.value.filter(id => id !== position.id)
    }
  }

  const confirmStartDissolving = async (position: any) => {
    showDissolveConfirm.value[position.id] = false
    await startDissolving(position)
  }

  const claimFees = async (position: any) => {
    if (!canisterServiceReady.value) {
      toast.add({
        title: 'Service Not Ready',
        description: 'Canister service is not ready. Please try again.',
        color: 'error',
      })
      return
    }

    // Set loading state for this specific position
    claimingFees.value = position.id

    try {
      const result = await canisterService.claimFees(position.id)
      
      toast.add({
        title: 'Fees Claimed Successfully!',
        description: result,
        color: 'success',
      })

      // Update position's fee index locally (no need for full refresh)
      const pool = allPools.value.find(p => p.token_symbol === position.token_symbol)
      if (pool) {
        position.last_fee_index = pool.global_fee_index
      }
      
      // Optional: Update user balance locally if needed
      // The claimable fees will now show 0 since last_fee_index = global_fee_index

    } catch (error) {
      console.error('Error claiming fees:', error)
      toast.add({
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    } finally {
      // Clear loading state
      claimingFees.value = null
    }
  }

  const stopDissolving = async (position: any) => {
    try {
      const result = await canisterService.cancelDissolving(position.id)
      
      toast.add({
        title: 'Dissolving Cancelled',
        description: result,
        color: 'success',
      })
      
      await loadUserPositions()
      
    } catch (error) {
      console.error('Error cancelling dissolving:', error)
      toast.add({
        title: 'Cancel Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    }
  }

  const withdrawPosition = async (position: any) => {
    withdrawingPositions.value.push(position.id)
    
    try {
      const result = await canisterService.withdrawAvailable(position.id)
      
      toast.add({
        title: 'Withdrawal Successful!',
        description: result,
        color: 'success',
      })
      
      await Promise.all([loadUserPositions(), loadUserBalances()])
      
    } catch (error) {
      console.error('Error withdrawing full amount:', error)
      toast.add({
        title: 'Withdrawal Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    } finally {
      withdrawingPositions.value = withdrawingPositions.value.filter(id => id !== position.id)
    }
  }

  const addToPosition = async (position: any) => {
    const amountStr = addStakeAmounts.value[position.id]
    if (!amountStr) return
    
    const amount = parseFormattedNumber(amountStr)
    if (amount <= 0) {
      toast.add({
        title: 'Invalid Amount',
        description: 'Amount must be greater than 0',
        color: 'error',
      })
      return
    }
    
    // Check balance
    const symbol = position.token_symbol
    const balance = userBalances.value[symbol]
    if (balance === undefined || balance === null) {
      toast.add({
        title: 'Balance Error',
        description: 'Unable to check your balance',
        color: 'error',
      })
      return
    }

    const balanceRaw = balance / Math.pow(10, TokenService.getTokenDecimals(symbol))
    if (amount > balanceRaw) {
      toast.add({
        title: 'Insufficient Balance',
        description: `You have ${TokenService.formatBalance(balance, symbol)} but trying to add ${amountStr}`,
        color: 'error',
      })
      return
    }
    
    addingToPositions.value.push(position.id)
    
    try {
      const rawAmount = TokenService.toRawAmount(amount, position.token_symbol)
      const result = await canisterService.addToPosition(position.id, BigInt(rawAmount))
      
      toast.add({
        title: 'Successfully Added to Position!',
        description: result,
        color: 'success',
      })
      
      // Clear input and refresh
      addStakeAmounts.value[position.id] = ''
      showAddStake.value[position.id] = false
      await Promise.all([loadUserPositions(), loadUserBalances(), loadAllPools()])
      
    } catch (error) {
      console.error('Error adding to position:', error)
      toast.add({
        title: 'Add to Position Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    } finally {
      addingToPositions.value = addingToPositions.value.filter(id => id !== position.id)
    }
  }

  const compoundFees = async (position: any) => {
    compoundingPositions.value.push(position.id)
    
    try {
      const result = await canisterService.compoundFees(position.id)
      
      toast.add({
        title: 'Fees Compounded Successfully!',
        description: result,
        color: 'success',
      })
      
      await Promise.all([loadUserPositions(), loadAllPools()])
      
    } catch (error) {
      console.error('Error compounding fees:', error)
      toast.add({
        title: 'Compound Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    } finally {
      compoundingPositions.value = compoundingPositions.value.filter(id => id !== position.id)
    }
  }

  const setMaxAddStake = (position: any) => {
    const symbol = position.token_symbol
    const balance = userBalances.value[symbol]
    
    if (balance === undefined || balance === null) {
      addStakeAmounts.value[position.id] = '0.00'
      return
    }
    
    const balanceRaw = balance / Math.pow(10, TokenService.getTokenDecimals(symbol))
    const decimals = TokenService.getDisplayDecimals(symbol)
    // Use Math.floor to round down and avoid exceeding balance
    const flooredAmount = Math.floor(balanceRaw * Math.pow(10, decimals)) / Math.pow(10, decimals)
    addStakeAmounts.value[position.id] = flooredAmount.toFixed(decimals)
  }


  // Watchers
  watch(() => auth.userProfile, async (newProfile) => {
    if (newProfile?.id && canisterServiceReady.value) {
      await loadUserPositions()
    }
  })

  watch(canisterServiceReady, async (isReady) => {
    if (isReady) {
      await refreshData()
    }
  })

  // Watch for tab changes to reload positions appropriately
  watch(activeDetailTab, async (newTab) => {
    if (canisterServiceReady.value && newTab === 'positions') {
      await loadUserPositions()
    }
  })

  // Simple reactive computed to handle URL parameters when both conditions are met
  const urlToken = computed(() => useRoute().query.token as string)
  const urlAction = computed(() => useRoute().query.action as string)
  
  // Single watcher that handles URL parameters when pools are loaded
  watch([urlToken, urlAction, allPools], async ([token, action, pools]) => {
    if (token && pools.length > 0) {
      console.log('🎯 Processing URL navigation:', { token, action })
      
      const targetPool = pools.find(pool => 
        pool.token_symbol.toLowerCase() === token.toLowerCase()
      )
      
      if (targetPool) {
        selectedPool.value = targetPool
        await loadUserPositions()
        
        if (action === 'stake') {
          activeDetailTab.value = 'stake'
        }
        
        console.log('✅ Successfully navigated to', targetPool.token_symbol, action ? `(${action} tab)` : '')
      } else {
        console.error('Token not found:', token, 'Available:', pools.map(p => p.token_symbol))
      }
    }
  }, { immediate: true })

  // Lifecycle
  onMounted(async () => {
    // Check if CanisterService is already ready
    if (canisterService.isInitialized()) {
      canisterServiceReady.value = true
    } else {
      // Poll for service readiness
      const checkService = setInterval(() => {
        if (canisterService.isInitialized()) {
          canisterServiceReady.value = true
          clearInterval(checkService)
        }
      }, 100)
      
      // Stop polling after 10 seconds
      setTimeout(() => {
        clearInterval(checkService)
        if (!canisterServiceReady.value) {
          console.error('CanisterService did not initialize within 10 seconds')
          loading.value = false
        }
      }, 10000)
    }
  })

  // Auto-refresh when entering the page
  onActivated(async () => {
    if (canisterServiceReady.value) {
      await refreshData()
    }
  })

  // Set up periodic refresh every 30 seconds
  let refreshInterval: NodeJS.Timeout | null = null
  
  onMounted(() => {
    refreshInterval = setInterval(async () => {
      if (canisterServiceReady.value && !loading.value) {
        await refreshData()
      }
    }, 30000) // Refresh every 30 seconds
  })

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })

  // Page title
  useHead({
    title: 'Liquidity Pools - Ionic Swap',
  })
</script>

<style scoped>
  /* All styles are inline classes */
</style>


