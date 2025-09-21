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
            class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
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

    <div class="flex h-full">
      <!-- Left Column - Pool List -->
      <div class="flex-1 flex flex-col">
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
        <div class="flex-1 bg-zinc-100 dark:bg-zinc-900 overflow-auto">
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
                  <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
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
        class="w-96 bg-zinc-100 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col"
      >
        <!-- Pool Details Tabs -->
        <div class="flex border-b border-zinc-200 dark:border-zinc-800">
          <button
            v-for="tab in detailTabs"
            :key="tab.value"
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeDetailTab === tab.value
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-gray-300',
            ]"
            @click="activeDetailTab = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Pool Details Content -->
        <div class="flex-1 p-4 overflow-auto">
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
                    <div class="text-xs text-zinc-400 dark:text-gray-500">
                      {{ calculateVotingPowerPercentage(position, selectedPool).toFixed(2) }}% of pool
                    </div>
                  </div>
                  <div>
                    <div class="text-zinc-500 dark:text-zinc-400">Claimable Fees</div>
                    <div class="font-semibold text-foreground">
                      {{ calculateClaimableFees(position).toFixed(6) }} {{ position.token_symbol }}
                    </div>
                    <div class="text-xs text-zinc-400 dark:text-gray-500">
                      ≈ ${{ (calculateClaimableFees(position) * getPositionPrice(position)).toFixed(2) }}
                    </div>
                  </div>
                </div>

                <!-- Position Actions -->
                <div class="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                  <div class="flex space-x-2">
                    <button
                      v-if="position.state.Locked"
                      @click="startDissolving(position)"
                      class="flex-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      Start Dissolving
                    </button>
                    <button
                      v-if="position.state.Dissolving"
                      @click="stopDissolving(position)"
                      class="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      Stop Dissolving
                    </button>
                    <button
                      v-if="position.state.Dissolved"
                      @click="withdrawPosition(position)"
                      class="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      Withdraw
                    </button>
                    <button
                      @click="claimFees(position)"
                      class="flex-1 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      Claim Fees
                    </button>
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
                    class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    class="flex-1 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-600"
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
                  class="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                class="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors flex items-center justify-center"
              >
                <UIcon v-if="stakeLoading" name="i-heroicons-arrow-path" class="w-4 h-4 mr-2 animate-spin" />
                {{ stakeLoading ? 'Staking...' : 'Stake Tokens' }}
              </button>

              <!-- Info Note -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div class="flex items-start">
                  <UIcon name="i-heroicons-information-circle" class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div class="text-sm text-blue-700 dark:text-blue-300">
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
    if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    if (status.Healthy !== undefined) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    if (status.NeedsRebalance !== undefined) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (status.Critical !== undefined) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    if (status.Halted !== undefined) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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
    if (state.Locked) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    if (state.Dissolving) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    if (state.Dissolved) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
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


  // Form helpers
  const parseFormattedNumber = (value: string): number => {
    const cleaned = value.replace(/,/g, '')
    return parseFloat(cleaned) || 0
  }

  const formatNumberWithCommas = (value: number, decimals: number): string => {
    if (isNaN(value) || !isFinite(value)) return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(value)
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
    
    // Format for display
    stakeAmount.value = formatNumberWithCommas(amount, TokenService.getDisplayDecimals(symbol))
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
    toast.add({
      title: 'Dissolving Coming Soon',
      description: 'Position management features will be available soon',
      color: 'info',
    })
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

    try {
      const result = await canisterService.claimFees(position.id)
      
      toast.add({
        title: 'Fees Claimed Successfully!',
        description: result,
        color: 'success',
      })

      // Refresh data
      await Promise.all([
        loadUserBalances(),
        loadUserPositions(),
        loadAllPools(),
        loadSystemStats()
      ])

    } catch (error) {
      console.error('Error claiming fees:', error)
      toast.add({
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'Please try again',
        color: 'error',
      })
    }
  }

  const stopDissolving = async (position: any) => {
    toast.add({
      title: 'Dissolving Management Coming Soon',
      description: 'Position management features will be available soon',
      color: 'info',
    })
  }

  const withdrawPosition = async (position: any) => {
    toast.add({
      title: 'Withdrawal Coming Soon',
      description: 'Position withdrawal will be available soon',
      color: 'info',
    })
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


