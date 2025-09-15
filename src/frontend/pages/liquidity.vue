<template>
  <div class="h-full bg-gray-50 dark:bg-neutral-950 overflow-hidden">
    <!-- Liquidity Header -->
    <div
      class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex-shrink-0"
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
              <div class="font-semibold text-gray-900 dark:text-white">
                Liquidity Pools
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Stake tokens and earn trading fees
              </div>
            </div>
          </div>

          <!-- System Stats -->
          <div class="flex items-center space-x-6 ml-8">
            <div class="text-center">
              <div class="text-xl font-bold text-purple-600 dark:text-purple-400">
                ${{ formatUSDTSystemValue(systemStats.totalStaked) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Total TVL</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-gray-900 dark:text-white">
                {{ formatSystemStats.totalVotingPower }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Voting Power</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold text-green-600 dark:text-green-400">
                ${{ formatUSDTSystemValue(systemStats.totalFees) }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">Fee Earnings</div>
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
          class="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-gray-800 px-4 py-2 flex-shrink-0"
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
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                ]"
                @click="activePoolTab = tab.value"
              >
                {{ tab.label }}
              </button>
            </div>

            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ allPools.length }} pools available
              </span>
            </div>
          </div>
        </div>

        <!-- Pool List -->
        <div class="flex-1 bg-white dark:bg-neutral-900 overflow-auto">
          <!-- Loading State -->
          <div v-if="loading && allPools.length === 0" class="p-8 text-center">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
            <p class="text-gray-500 dark:text-gray-400">Loading liquidity pools...</p>
          </div>

          <!-- Pool Cards -->
          <div v-else class="p-4 space-y-4">
            <div
              v-for="pool in filteredPools"
              :key="pool.token_symbol"
              :class="[
                'border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer transition-all',
                selectedPool?.token_symbol === pool.token_symbol
                  ? 'ring-2 ring-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-neutral-800',
              ]"
              @click="selectPool(pool)"
            >
              <div class="grid grid-cols-14 gap-1 items-center">
                <!-- Token Info - Fixed Width -->
                <div class="col-span-2 flex items-center space-x-2">
                  <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 flex items-center justify-center">
                    <UIcon :name="getTokenIcon(pool.token_symbol)" class="w-5 h-5" />
                  </div>
                  <div>
                    <div class="font-semibold text-gray-900 dark:text-white text-sm">
                      {{ pool.token_symbol }}
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">
                      {{ TokenService.getTokenName(pool.token_symbol) }}
                    </div>
                  </div>
                </div>

                <!-- TVL USDT - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-purple-600 dark:text-purple-400">
                    ${{ formatUSDTValue(pool.tvl_usdt) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">TVL</div>
                </div>

                <!-- Total Staked - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ TokenService.formatBalance(typeof pool.total_staked === 'bigint' ? Number(pool.total_staked) : pool.total_staked, pool.token_symbol) }} {{ pool.token_symbol }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Total Staked</div>
                </div>

                <!-- Available - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {{ TokenService.formatBalance(typeof pool.available_liquidity === 'bigint' ? Number(pool.available_liquidity) : pool.available_liquidity, pool.token_symbol) }} {{ pool.token_symbol }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Available</div>
                </div>

                <!-- Fee Earnings USDT - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-green-600 dark:text-green-400">
                    ${{ formatUSDTValue(pool.total_fees_collected_usdt) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Fee Earnings</div>
                </div>

                <!-- Fees (Token) - Fixed Width -->
                <div class="col-span-2 text-center">
                  <div class="text-sm font-semibold text-green-600 dark:text-green-400">
                    {{ formatPoolFees(pool.total_fees_collected, pool.token_symbol) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Fees</div>
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
        class="w-96 bg-white dark:bg-neutral-900 border-l border-gray-200 dark:border-gray-800 flex flex-col"
      >
        <!-- Pool Details Tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-800">
          <button
            v-for="tab in detailTabs"
            :key="tab.value"
            :class="[
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeDetailTab === tab.value
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
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
            <UIcon name="i-heroicons-cursor-arrow-rays" class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h4 class="text-lg font-medium text-foreground mb-2">Select a Pool</h4>
            <p class="text-gray-500 dark:text-gray-400">
              Choose a liquidity pool to view details and manage your positions.
            </p>
          </div>

          <!-- Pool Overview Tab -->
          <div v-else-if="activeDetailTab === 'overview'" class="space-y-6">
            <!-- Pool Info -->
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                  <UIcon :name="getTokenIcon(selectedPool.token_symbol)" class="w-8 h-8" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-foreground">{{ selectedPool.token_symbol }} Pool</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ TokenService.getTokenName(selectedPool.token_symbol) }}</p>
                </div>
              </div>

              <!-- Pool Stats Grid -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Total Staked</div>
                  <div class="font-semibold text-foreground">
                    {{ TokenService.formatBalance(typeof selectedPool.total_staked === 'bigint' ? Number(selectedPool.total_staked) : selectedPool.total_staked, selectedPool.token_symbol) }} {{ selectedPool.token_symbol }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Available Liquidity</div>
                  <div class="font-semibold text-foreground">
                    {{ TokenService.formatBalance(typeof selectedPool.available_liquidity === 'bigint' ? Number(selectedPool.available_liquidity) : selectedPool.available_liquidity, selectedPool.token_symbol) }} {{ selectedPool.token_symbol }}
                  </div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Total Voting Power</div>
                  <div class="font-semibold text-foreground">{{ selectedPool.total_voting_power.toFixed(2) }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">Fees Collected</div>
                  <div class="font-semibold text-green-600 dark:text-green-400">
                    {{ formatPoolFees(selectedPool.total_fees_collected, selectedPool.token_symbol) }}
                  </div>
                  <div class="text-xs text-green-500 dark:text-green-400">
                    ${{ formatUSDTValue(selectedPool.total_fees_collected_usdt) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Fee Breakdown -->
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Fee Breakdown (24h)</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Trading Fees</span>
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
                  <span class="text-sm text-gray-500 dark:text-gray-400">Spread Fees</span>
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
                  <span class="text-sm text-gray-500 dark:text-gray-400">Volatility Penalties</span>
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
                  <span class="text-sm text-gray-500 dark:text-gray-400">Depth Penalties</span>
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
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Current Conditions</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Pool Status</span>
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
                  <span class="text-sm text-gray-500 dark:text-gray-400">1h Volatility</span>
                  <span class="font-semibold text-foreground">{{ (selectedPool.current_volatility_1h * 100).toFixed(2) }}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">1h Volume</span>
                  <span class="font-semibold text-foreground">
                    {{ TokenService.formatBalance(typeof selectedPool.total_volume_1h === 'bigint' ? Number(selectedPool.total_volume_1h) : selectedPool.total_volume_1h, selectedPool.token_symbol) }} {{ selectedPool.token_symbol }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Threshold Information -->
            <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Liquidity Thresholds</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Current Liquidity (USDT)</span>
                  <span class="font-semibold text-foreground">{{ formatThresholdStatus(selectedPool) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Healthy Threshold</span>
                  <span class="text-sm text-green-600 dark:text-green-400">≥ $10.0M</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Rebalance Threshold</span>
                  <span class="text-sm text-yellow-600 dark:text-yellow-400">≥ $7.0M</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Critical Threshold</span>
                  <span class="text-sm text-orange-600 dark:text-orange-400">≥ $5.0M</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-500 dark:text-gray-400">Halt Threshold</span>
                  <span class="text-sm text-red-600 dark:text-red-400">< $5.0M</span>
                </div>
              </div>
            </div>
          </div>

          <!-- My Positions Tab -->
          <div v-else-if="activeDetailTab === 'positions'" class="space-y-4">
            <!-- Loading State -->
            <div v-if="positionsLoading" class="text-center py-8">
              <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 mx-auto mb-2 animate-spin text-gray-400" />
              <p class="text-gray-500 dark:text-gray-400">Loading positions...</p>
            </div>

            <!-- No Positions -->
            <div v-else-if="userPositions.length === 0" class="text-center py-8">
              <UIcon name="i-heroicons-banknotes" class="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h4 class="text-lg font-medium text-foreground mb-2">No Positions</h4>
              <p class="text-gray-500 dark:text-gray-400 mb-4">
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
                class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-700 flex items-center justify-center">
                      <UIcon :name="getTokenIcon(position.token_symbol)" class="w-5 h-5" />
                    </div>
                    <div>
                      <div class="font-semibold text-foreground">{{ position.token_symbol }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">ID: {{ position.id.slice(-8) }}</div>
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
                    <div class="text-gray-500 dark:text-gray-400">Staked Amount</div>
                    <div class="font-semibold text-foreground">
                      {{ TokenService.formatBalance(typeof position.staked_amount === 'bigint' ? Number(position.staked_amount) : position.staked_amount, position.token_symbol) }} {{ position.token_symbol }}
                    </div>
                  </div>
                  <div>
                    <div class="text-gray-500 dark:text-gray-400">Dissolve Delay</div>
                    <div class="font-semibold text-foreground">{{ formatDuration(position.dissolve_delay_seconds) }}</div>
                  </div>
                  <div>
                    <div class="text-gray-500 dark:text-gray-400">Age</div>
                    <div class="font-semibold text-foreground">{{ formatAge(position.created_at) }}</div>
                  </div>
                  <div>
                    <div class="text-gray-500 dark:text-gray-400">Voting Power</div>
                    <div class="font-semibold text-foreground">{{ calculateVotingPower(position).toFixed(2) }}</div>
                  </div>
                </div>

                <!-- Position Actions -->
                <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
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
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
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
                    class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md text-right text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                  <div class="absolute left-3 top-2 text-sm text-gray-500 dark:text-gray-400">
                    {{ selectedPool?.token_symbol || 'TOKEN' }}
                  </div>
                </div>

                <!-- Percentage Buttons -->
                <div class="flex space-x-1">
                  <button
                    v-for="percent in [25, 50, 75, 100]"
                    :key="percent"
                    class="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-neutral-600"
                    @click="setStakeAmount(percent)"
                  >
                    {{ percent }}%
                  </button>
                </div>
              </div>

              <!-- Dissolve Delay -->
              <div class="space-y-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Dissolve Delay</label>
                <select
                  v-model="selectedDissolveDelay"
                  class="w-full px-3 py-2 bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option v-for="option in dissolveDelayOptions" :key="option.value" :value="option.value">
                    {{ option.label }} ({{ option.multiplier }}x voting power)
                  </option>
                </select>
              </div>

              <!-- Stake Preview -->
              <div class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <h4 class="font-medium text-foreground mb-2">Staking Preview</h4>
                <div class="space-y-1 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Amount to Stake</span>
                    <span class="font-semibold text-foreground">{{ stakeAmount || '0.00' }} {{ selectedPool?.token_symbol || 'TOKEN' }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Dissolve Delay</span>
                    <span class="font-semibold text-foreground">{{ formatDuration(selectedDissolveDelay) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500 dark:text-gray-400">Expected Voting Power</span>
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
            <div v-if="selectedPool" class="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
              <h4 class="font-medium text-foreground mb-3">Quick Stats</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Pool Utilization</span>
                  <span class="font-semibold text-foreground">{{ getPoolUtilization(selectedPool).toFixed(1) }}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500 dark:text-gray-400">Fee Index</span>
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
  const systemStats = ref({ totalStaked: 0, totalVotingPower: 0, totalFees: 0, totalPools: 0 })
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
    totalStaked: `$${(systemStats.value.totalStaked / 1_000_000).toFixed(1)}M`,
    totalVotingPower: systemStats.value.totalVotingPower.toFixed(0),
    totalFees: `$${(systemStats.value.totalFees / 1000).toFixed(1)}K`,
  }))

  // Helper functions
  const getTokenIcon = (symbol: string) => {
    const icons: Record<string, string> = {
      'BTC': 'logos:bitcoin',
      'ETH': 'token-branded:ethereum',
      'XRP': 'cryptocurrency-color:xrp',
      'USDT': 'cryptocurrency-color:usdt',
      'BNB': 'token-branded:binance',
      'SOL': 'token-branded:solana',
      'DOGE': 'simple-icons:dogecoin',
      'ADA': 'logos:cardano-icon',
      'TRX': 'token-branded:tron',
      'ICP': 'token-branded:icp',
    }
    return icons[symbol] || 'cryptocurrency-color:generic'
  }

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
      return '0.00'
    }
    
    if (actualValue >= 1_000_000) {
      return `${(actualValue / 1_000_000).toFixed(1)}M`
    } else if (actualValue >= 1_000) {
      return `${(actualValue / 1_000).toFixed(1)}K`
    } else {
      return actualValue.toFixed(2)
    }
  }

  const formatUSDTSystemValue = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`
    } else {
      return value.toFixed(2)
    }
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
    if (state.Locked) return 'Locked'
    if (state.Dissolving) return 'Dissolving'
    if (state.Dissolved) return 'Dissolved'
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
    // Simplified voting power calculation
    const stakeAmount = Number(position.staked_amount) / Math.pow(10, TokenService.getTokenDecimals(position.token_symbol))
    const delayMultiplier = Math.min(4.0, 1.0 + (Number(position.dissolve_delay_seconds) / (365 * 24 * 3600)) * 3.0)
    const age = (Date.now() / 1000) - Number(position.created_at)
    const ageMultiplier = Math.min(1.5, 1.0 + (age / (4 * 365 * 24 * 3600)) * 0.5)
    return stakeAmount * delayMultiplier * ageMultiplier
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

  const formatUserBalance = (symbol: string) => {
    if (!auth.userProfile?.id || !canisterServiceReady.value) return '0.00'
    
    const balance = userBalances.value[symbol]
    if (balance === undefined || balance === null) return '0.00'
    
    return TokenService.formatBalance(balance, symbol)
  }

  const formatThresholdStatus = (pool: any) => {
    // Calculate threshold amounts based on current token price and configuration
    // For display purposes, we'll show the current threshold level
    const availableLiquidity = Number(pool.available_liquidity)
    
    // Default threshold values in USDT (these should match backend config)
    const defaultThresholds = {
      healthy: 10_000_000,    // $10M
      rebalance: 7_000_000,   // $7M  
      halt: 5_000_000         // $5M
    }
    
    // Get approximate price for conversion (fallback prices)
    const price = (() => {
      switch (pool.token_symbol) {
        case 'USDT': return 1.0
        case 'BTC': return 45000.0
        case 'ETH': return 3000.0
        case 'SOL': return 100.0
        case 'BNB': return 300.0
        case 'XRP': return 0.6
        case 'DOGE': return 0.08
        case 'ADA': return 0.5
        case 'TRX': return 0.1
        case 'ICP': return 12.0
        default: return 1.0
      }
    })()
    
    // Convert available liquidity to USDT value
    const decimals = TokenService.getTokenDecimals(pool.token_symbol)
    const liquidityUSDT = (availableLiquidity / Math.pow(10, decimals)) * price
    
    // Determine threshold status and format
    if (liquidityUSDT >= defaultThresholds.healthy) {
      return `$${(liquidityUSDT / 1_000_000).toFixed(1)}M`
    } else if (liquidityUSDT >= defaultThresholds.rebalance) {
      return `$${(liquidityUSDT / 1_000_000).toFixed(1)}M`
    } else if (liquidityUSDT >= defaultThresholds.halt) {
      return `$${(liquidityUSDT / 1_000_000).toFixed(1)}M`
    } else {
      return `$${(liquidityUSDT / 1_000).toFixed(0)}K`
    }
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
      await Promise.all([
        loadAllPools(),
        loadSystemStats(),
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
      systemStats.value = {
        totalStaked: Number(stats[2]),      // total_staked_usdt (index 2)
        totalVotingPower: Number(stats[0]), // total_positions (index 0) 
        totalFees: Number(stats[3]),        // total_fees_usdt (index 3)
        totalPools: Number(stats[1])        // total_pools (index 1)
      }
    } catch (error) {
      console.error('Error loading system stats:', error)
    }
  }

  const loadUserPositions = async () => {
    if (!auth.userProfile?.id || !canisterServiceReady.value) return
    
    positionsLoading.value = true
    try {
      const positions = await canisterService.getLiquidityPositions(auth.userProfile.id as any)
      
      // Filter positions for selected pool if one is selected
      if (selectedPool.value) {
        userPositions.value = positions.filter(p => p.token_symbol === selectedPool.value.token_symbol)
      } else {
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

  const claimFees = async (position: any) => {
    toast.add({
      title: 'Fee Claims Coming Soon',
      description: 'Fee claiming functionality will be available soon',
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
