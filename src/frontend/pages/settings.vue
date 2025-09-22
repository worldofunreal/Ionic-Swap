<template>
  <div class="min-h-screen bg-zinc-50 dark:bg-zinc-900">
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Page Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-zinc-900 dark:text-white">
          Settings
        </h1>
        <p class="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your wallet addresses, theme preferences, and privacy settings
        </p>
      </div>

      <!-- Settings Tabs -->
      <div class="bg-zinc-100 dark:bg-zinc-900 rounded-lg shadow">
        <div class="border-b border-zinc-200 dark:border-zinc-800">
          <nav class="-mb-px flex space-x-8 px-6">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300 dark:text-zinc-400 dark:hover:text-zinc-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
              ]"
              @click="activeTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Wallet Management -->
          <div v-if="activeTab === 'wallets'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-zinc-900 dark:text-white">
                Wallet Addresses
              </h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage your connected wallet addresses for cross-chain
                functionality
              </p>
            </div>

            <!-- EVM Address -->
            <div class="space-y-4">
              <div class="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div v-if="editingWallet === 'evm'" class="space-y-3">
                  <div class="flex items-center gap-3 mb-3">
                    <img
                      :src="TokenService.getTokenIcon('ETH')"
                      alt="Ethereum icon"
                      class="w-10 h-10"
                    />
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                        Ethereum Address
                      </h4>
                      <UInput
                        v-model="walletAddresses.evm"
                        placeholder="0x..."
                        class="w-full mt-2"
                      />
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                      :disabled="updatingWallet"
                      @click="updateWalletAddress('evm')"
                    >
                      <UIcon v-if="updatingWallet" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                      <UIcon v-else name="i-heroicons-check-20-solid" class="w-4 h-4" />
                      {{ updatingWallet ? 'Updating...' : 'Update' }}
                    </button>
                    <button
                      class="px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                      @click="cancelEditWallet('evm')"
                    >
                      <UIcon name="i-heroicons-x-mark-20-solid" class="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img
                      :src="TokenService.getTokenIcon('ETH')"
                      alt="Ethereum icon"
                      class="w-10 h-10"
                    />
                    <div>
                      <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                        Ethereum Address
                      </h4>
                      <p class="text-sm text-zinc-500 dark:text-zinc-400">
                        {{
                          userProfile?.evm_address?.[0]
                            ? formatAddress(userProfile.evm_address[0])
                            : 'Not connected'
                        }}
                      </p>
                    </div>
                  </div>
                  <button
                    class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                    @click="editWalletAddress('evm')"
                  >
                    <UIcon name="i-heroicons-link-20-solid" class="w-4 h-4" />
                    {{ userProfile?.evm_address?.[0] ? 'Update Address' : 'Connect Wallet' }}
                  </button>
                </div>
              </div>

              <!-- Bitcoin Address -->
              <div class="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div v-if="editingWallet === 'bitcoin'" class="space-y-3">
                  <div class="flex items-center gap-3 mb-3">
                    <img
                      :src="TokenService.getTokenIcon('BTC')"
                      alt="Bitcoin icon"
                      class="w-10 h-10"
                    />
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                        Bitcoin Address
                      </h4>
                      <UInput
                        v-model="walletAddresses.bitcoin"
                        placeholder="bc1..."
                        class="w-full mt-2"
                      />
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                      :disabled="updatingWallet"
                      @click="updateWalletAddress('bitcoin')"
                    >
                      <UIcon v-if="updatingWallet" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                      <UIcon v-else name="i-heroicons-check-20-solid" class="w-4 h-4" />
                      {{ updatingWallet ? 'Updating...' : 'Update' }}
                    </button>
                    <button
                      class="px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                      @click="cancelEditWallet('bitcoin')"
                    >
                      <UIcon name="i-heroicons-x-mark-20-solid" class="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img
                      :src="TokenService.getTokenIcon('BTC')"
                      alt="Bitcoin icon"
                      class="w-10 h-10"
                    />
                    <div>
                      <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                        Bitcoin Address
                      </h4>
                      <p class="text-sm text-zinc-500 dark:text-zinc-400">
                        {{
                          userProfile?.bitcoin_address?.[0]
                            ? formatAddress(userProfile.bitcoin_address[0])
                            : 'Not connected'
                        }}
                      </p>
                    </div>
                  </div>
                  <button
                    class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                    @click="editWalletAddress('bitcoin')"
                  >
                    <UIcon name="i-heroicons-link-20-solid" class="w-4 h-4" />
                    {{ userProfile?.bitcoin_address?.[0] ? 'Update Address' : 'Connect Wallet' }}
                  </button>
                </div>
              </div>

              <!-- Solana Address -->
              <div class="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <div v-if="editingWallet === 'solana'" class="space-y-3">
                  <div class="flex items-center gap-3 mb-3">
                    <img
                      :src="TokenService.getTokenIcon('SOL')"
                      alt="Solana icon"
                      class="w-10 h-10"
                    />
                    <div class="flex-1">
                      <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                        Solana Address
                      </h4>
                      <UInput
                        v-model="walletAddresses.solana"
                        placeholder="..."
                        class="w-full mt-2"
                      />
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <button
                      class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                      :disabled="updatingWallet"
                      @click="updateWalletAddress('solana')"
                    >
                      <UIcon v-if="updatingWallet" name="i-heroicons-arrow-path" class="w-4 h-4 animate-spin" />
                      <UIcon v-else name="i-heroicons-check-20-solid" class="w-4 h-4" />
                      {{ updatingWallet ? 'Updating...' : 'Update' }}
                    </button>
                    <button
                      class="px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                      @click="cancelEditWallet('solana')"
                    >
                      <UIcon name="i-heroicons-x-mark-20-solid" class="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>

                <div v-else class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <img
                      :src="TokenService.getTokenIcon('SOL')"
                      alt="Solana icon"
                      class="w-10 h-10"
                    />
                    <div>
                      <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                        Solana Address
                      </h4>
                      <p class="text-sm text-zinc-500 dark:text-zinc-400">
                        {{
                          userProfile?.solana_address?.[0]
                            ? formatAddress(userProfile.solana_address[0])
                            : 'Not connected'
                        }}
                      </p>
                    </div>
                  </div>
                  <button
                    class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                    @click="editWalletAddress('solana')"
                  >
                    <UIcon name="i-heroicons-link-20-solid" class="w-4 h-4" />
                    {{ userProfile?.solana_address?.[0] ? 'Update Address' : 'Connect Wallet' }}
                  </button>
                </div>
              </div>

              <!-- ICP Principal -->
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <img
                    :src="TokenService.getTokenIcon('ICP')"
                    alt="ICP icon"
                    class="w-10 h-10"
                  />
                  <div>
                    <h4
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      ICP Principal
                    </h4>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      {{
                        userProfile?.id
                          ? formatAddress(userProfile.id.toText())
                          : 'Not connected'
                      }}
                    </p>
                  </div>
                </div>
                <UButton color="neutral" variant="soft" size="sm" disabled>
                  Connected
                </UButton>
              </div>

            </div>
          </div>

          <!-- Theme Preferences -->
          <div v-if="activeTab === 'theme'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-zinc-900 dark:text-white">
                Theme Preferences
              </h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Customize your visual experience with dark mode and color themes
              </p>
            </div>

            <!-- Dark Mode Toggle -->
            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-zinc-100 dark:bg-zinc-700 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      :name="
                        colorMode.value === 'dark'
                          ? 'i-heroicons-moon-20-solid'
                          : 'i-heroicons-sun-20-solid'
                      "
                      class="w-6 h-6 text-zinc-600 dark:text-zinc-400"
                    />
                  </div>
                  <div>
                    <h4
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      Dark Mode
                    </h4>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      Switch between light and dark themes
                    </p>
                  </div>
                </div>
                <button
                  class="px-4 py-3 font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                  :class="colorMode.value === 'dark' 
                    ? 'bg-primary-500 hover:bg-primary-600 text-white' 
                    : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white'"
                  @click="toggleTheme"
                >
                  <UIcon 
                    :name="colorMode.value === 'dark' ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'" 
                    class="w-4 h-4" 
                  />
                  {{ colorMode.value === 'dark' ? 'Dark Mode' : 'Light Mode' }}
                </button>
              </div>

              <!-- Color Theme -->
              <div class="space-y-4">
                <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                  Color Theme
                </h4>
                <div class="grid grid-cols-4 gap-3">
                  <button
                    v-for="theme in Object.keys(colorThemes)"
                    :key="theme"
                    class="relative p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105"
                    :class="[
                      colorTheme === theme
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800',
                    ]"
                    @click="setTheme(theme as any)"
                  >
                    <div
                      class="w-8 h-8 rounded-full mx-auto mb-2"
                      :class="getThemeColorClass(theme)"
                    />
                    <span
                      class="text-xs font-medium text-zinc-700 dark:text-zinc-300 capitalize"
                    >
                      {{ theme }}
                    </span>
                    <div
                      v-if="colorTheme === theme"
                      class="absolute top-2 right-2 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center"
                    >
                      <UIcon
                        name="i-heroicons-check-20-solid"
                        class="w-3 h-3 text-white"
                      />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Privacy Settings -->
          <div v-if="activeTab === 'privacy'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-zinc-900 dark:text-white">
                Privacy Settings
              </h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Control your privacy and data sharing preferences
              </p>
            </div>

            <div class="space-y-4">
              <!-- Profile Visibility -->
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div>
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                    Profile Visibility
                  </h4>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    Control who can see your profile information
                  </p>
                </div>
                <select
                  v-model="privacySettings.profileVisibility"
                  @change="savePrivacySettings"
                  class="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white w-40"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <!-- Activity Visibility -->
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div>
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                    Activity Visibility
                  </h4>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    Control who can see your activity and transactions
                  </p>
                </div>
                <select
                  v-model="privacySettings.activityVisibility"
                  @change="savePrivacySettings"
                  class="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white w-40"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <!-- Wallet Address Visibility -->
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div>
                  <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                    Wallet Address Visibility
                  </h4>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    Control who can see your wallet addresses
                  </p>
                </div>
                <select
                  v-model="privacySettings.walletVisibility"
                  @change="savePrivacySettings"
                  class="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white w-40"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>


              <!-- Data Sharing -->
              <div class="space-y-4">
                <h4 class="text-sm font-medium text-zinc-900 dark:text-white">
                  Data Sharing Preferences
                </h4>

                <div
                  class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                >
                  <div>
                    <h5
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      Analytics & Usage Data
                    </h5>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      Help us improve by sharing anonymous usage data
                    </p>
                  </div>
                  <USwitch v-model="privacySettings.analyticsEnabled" @change="savePrivacySettings" />
                </div>

                <div
                  class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                >
                  <div>
                    <h5
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      Marketing Communications
                    </h5>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      Receive updates about new features and promotions
                    </p>
                  </div>
                  <USwitch v-model="privacySettings.marketingEnabled" @change="savePrivacySettings" />
                </div>

                <div
                  class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                >
                  <div>
                    <h5
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      Third-Party Integrations
                    </h5>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      Allow data sharing with trusted third-party services
                    </p>
                  </div>
                  <USwitch v-model="privacySettings.thirdPartyEnabled" @change="savePrivacySettings" />
                </div>
              </div>
            </div>
          </div>

          <!-- Account Management -->
          <div v-if="activeTab === 'account'" class="space-y-6">
            <div>
              <h3 class="text-lg font-medium text-zinc-900 dark:text-white">
                Account Management
              </h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage your account settings and profile information
              </p>
            </div>

            <div class="space-y-4">
              <!-- Username Management -->
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-heroicons-at-symbol-20-solid"
                      class="w-6 h-6 text-primary-600 dark:text-primary-400"
                    />
                  </div>
                  <div>
                    <h4
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      Username
                    </h4>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      Current username: @{{ userProfile?.username || 'Not set' }}
                    </p>
                  </div>
                </div>
                <button
                  class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                  @click="openUsernameModal"
                >
                  <UIcon name="i-heroicons-at-symbol-20-solid" class="w-4 h-4" />
                  Change Username
                </button>
              </div>

              <!-- Profile Management -->
              <div
                class="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-heroicons-user-circle-20-solid"
                      class="w-6 h-6 text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div>
                    <h4
                      class="text-sm font-medium text-zinc-900 dark:text-white"
                    >
                      Profile Information
                    </h4>
                    <p class="text-sm text-zinc-500 dark:text-zinc-400">
                      Edit your display name, bio, avatar, and other profile
                      details
                    </p>
                  </div>
                </div>
                <button
                  class="px-4 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                  @click="openEditProfileModal"
                >
                  <UIcon name="i-heroicons-user-circle-20-solid" class="w-4 h-4" />
                  Edit Profile
                </button>
              </div>

              <!-- Ionic Wallet Recovery (only show for local wallet users) -->
              <div 
                v-if="userProfile && auth.nativeWallet === 'local'" 
                class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
              >
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <img src="/logo.svg" alt="Ionic Wallet" class="w-10 h-10" />
                    <div>
                      <h4 class="text-sm font-medium text-amber-900 dark:text-amber-100">
                        Ionic Wallet Recovery Phrase
                      </h4>
                      <p class="text-sm text-amber-700 dark:text-amber-300">
                        {{ showSeed ? 'Keep this phrase safe and private' : 'Click to reveal your 12-word recovery phrase' }}
                      </p>
                    </div>
                  </div>
                  
                  <!-- Show Recovery Button (top right) -->
                  <button
                    v-if="!showSeed"
                    class="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                    @click="revealSeed"
                  >
                    <UIcon name="i-heroicons-eye-20-solid" class="w-4 h-4" />
                    Show Recovery Phrase
                  </button>
                </div>

                <div v-if="showSeed" class="mb-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded border font-mono text-sm">
                  {{ userSeed || 'Loading...' }}
                </div>

                <div v-if="showSeed" class="flex gap-2">
                  <button
                    class="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                    @click="copySeed"
                  >
                    <UIcon name="i-heroicons-clipboard-20-solid" class="w-4 h-4" />
                    Copy
                  </button>
                  <button
                    class="px-4 py-3 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                    @click="hideSeed"
                  >
                    <UIcon name="i-heroicons-eye-slash-20-solid" class="w-4 h-4" />
                    Hide
                  </button>
                </div>
              </div>

              <!-- Account Deletion -->
              <div
                class="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center"
                  >
                    <UIcon
                      name="i-heroicons-trash-20-solid"
                      class="w-6 h-6 text-red-600 dark:text-red-400"
                    />
                  </div>
                  <div>
                    <h4
                      class="text-sm font-medium text-red-900 dark:text-red-100"
                    >
                      Delete Account
                    </h4>
                    <p class="text-sm text-red-700 dark:text-red-300">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                </div>
                <button
                  class="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-2"
                  @click="deleteAccount"
                >
                  <UIcon name="i-heroicons-trash-20-solid" class="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-b-lg">
          <div class="flex justify-between items-center">
            <p class="text-sm text-zinc-500 dark:text-zinc-400">
              {{ saveStatus }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Username Change Modal -->
    <UsernameChangeModal ref="usernameModal" />
    
    <!-- Edit Profile Modal -->
    <EditProfileModal ref="editProfileModalRef" />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/stores/auth'
  import { useColorTheme } from '@/composables/useColorTheme'
  import { useTheme } from '@/composables/useTheme'
  import { canisterService, type PrivacySettings, type VisibilityLevel } from '@/services/CanisterService'
  import { TokenService } from '@/services/TokenService'
  import { useToast } from '#imports'
  import { appCacheService } from '@/services/AppCacheService'
  import { CrossChainSeedService } from '@/services/CrossChainSeedService'
  import UsernameChangeModal from '@/components/UsernameChangeModal.vue'
  import EditProfileModal from '@/components/EditProfileModal.vue'

  // Authentication and user data
  const auth = useAuthStore()
  const userProfile = computed(() => auth.userProfile)

  // Theme management
  const { theme: colorMode, setTheme: setThemeAction } = useTheme()
  const { colorTheme, setColorTheme: setTheme, colorThemes } = useColorTheme()

  // UI state
  const activeTab = ref('account')
  const saving = ref(false)
  const updatingWallet = ref(false)
  const editingWallet = ref('')
  const walletAddresses = ref({
    evm: '',
    bitcoin: '',
    solana: '',
  })

  // Seed management state
  const showSeed = ref(false)
  const userSeed = ref('')

  // Modal refs
  const usernameModal = ref<InstanceType<typeof UsernameChangeModal>>()
  const editProfileModalRef = ref<InstanceType<typeof EditProfileModal>>()

  // Privacy settings - simplified for UI
  const privacySettings = ref({
    profileVisibility: 'public',
    activityVisibility: 'public', 
    walletVisibility: 'public',
    analyticsEnabled: true,
    marketingEnabled: false,
    thirdPartyEnabled: false,
  })

  const loadingPrivacySettings = ref(false)

  // Tabs configuration
  const tabs = [
    { id: 'account', name: 'Account' },
    { id: 'privacy', name: 'Privacy' },
    { id: 'theme', name: 'Theme' },
    { id: 'wallets', name: 'Wallets' },
  ]

  // Computed properties
  const hasUnsavedChanges = computed(() => {
    // Privacy settings changes need to be saved
    return loadingPrivacySettings.value
  })

  const saveStatus = computed(() => {
    if (saving.value) return 'Saving changes...'
    if (loadingPrivacySettings.value) return 'Loading privacy settings...'
    if (hasUnsavedChanges.value) return 'You have unsaved changes'
    return 'All changes saved'
  })

  // Helper functions to convert between frontend and backend formats
  const createVisibilityLevel = (value: string): VisibilityLevel => {
    switch (value) {
      case 'public': return { Public: null } as VisibilityLevel
      case 'followers': return { FollowersOnly: null } as VisibilityLevel
      case 'private': return { Private: null } as VisibilityLevel
      default: return { Public: null } as VisibilityLevel
    }
  }

  const getVisibilityValue = (visibility: VisibilityLevel): string => {
    if ('Public' in visibility) return 'public'
    if ('FollowersOnly' in visibility) return 'followers'
    if ('Private' in visibility) return 'private'
    return 'public'
  }

  // Methods
  const toggleTheme = () => {
    setThemeAction(colorMode.value === 'dark' ? 'light' : 'dark')
  }

  const editWalletAddress = (type: string) => {
    editingWallet.value = type
    const addressMap = {
      evm: userProfile.value?.evm_address?.[0] || '',
      bitcoin: userProfile.value?.bitcoin_address?.[0] || '',
      solana: userProfile.value?.solana_address?.[0] || '',
    }
    walletAddresses.value[type as keyof typeof walletAddresses.value] =
      addressMap[type as keyof typeof addressMap] || ''
  }

  const cancelEditWallet = (type: string) => {
    editingWallet.value = ''
    walletAddresses.value[type as keyof typeof walletAddresses.value] = ''
  }

  const updateWalletAddress = async (type: string) => {
    const address =
      walletAddresses.value[type as keyof typeof walletAddresses.value]
    if (!address.trim()) {
      const toast = useToast()
      toast.add({
        title: 'Invalid Address',
        description: 'Please enter a valid wallet address',
        color: 'error',
      })
      return
    }

    updatingWallet.value = true
    try {
      const updateMethod = {
        evm: () => canisterService.updateEvmAddress(address.trim()),
        bitcoin: () => canisterService.updateBitcoinAddress(address.trim()),
        solana: () => canisterService.updateSolanaAddress(address.trim()),
      }[type]

      if (updateMethod) {
        await updateMethod()
        // Refresh the user profile to get updated data
        // Note: You may need to implement this method in your auth store
        // await auth.refreshProfile()

        const toast = useToast()
        toast.add({
          title: 'Address Updated',
          description: `${type.toUpperCase()} address has been updated successfully`,
          color: 'success',
        })

        editingWallet.value = ''
      }
    } catch (error) {
      console.error('Failed to update wallet address:', error)
      const toast = useToast()
      toast.add({
        title: 'Update Failed',
        description: 'Failed to update wallet address. Please try again.',
        color: 'error',
      })
    } finally {
      updatingWallet.value = false
    }
  }

  const openEditProfileModal = () => {
    editProfileModalRef.value?.open()
  }

  const openUsernameModal = () => {
    usernameModal.value?.open()
  }

  // Load privacy settings from backend
  const loadPrivacySettings = async () => {
    if (!auth.authenticated) return

    loadingPrivacySettings.value = true
    try {
      const settings = await canisterService.getPrivacySettings()
      // Convert backend format to frontend format
      privacySettings.value = {
        profileVisibility: getVisibilityValue(settings.profile_visibility),
        activityVisibility: getVisibilityValue(settings.activity_visibility),
        walletVisibility: getVisibilityValue(settings.wallet_visibility),
        analyticsEnabled: settings.analytics_enabled,
        marketingEnabled: settings.marketing_enabled,
        thirdPartyEnabled: settings.third_party_enabled,
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error)
      // Use defaults if loading fails
      privacySettings.value = {
        profileVisibility: 'public',
        activityVisibility: 'public',
        walletVisibility: 'public',
        analyticsEnabled: true,
        marketingEnabled: false,
        thirdPartyEnabled: false,
      }
    } finally {
      loadingPrivacySettings.value = false
    }
  }

  // Save privacy settings to backend
  const savePrivacySettings = async () => {
    if (!auth.authenticated) {
      console.log('❌ Not authenticated, cannot save privacy settings')
      return
    }

    console.log('💾 Saving privacy settings:', privacySettings.value)
    saving.value = true
    
    try {
      // Convert frontend format to backend format
      const backendSettings: PrivacySettings = {
        profile_visibility: createVisibilityLevel(privacySettings.value.profileVisibility),
        activity_visibility: createVisibilityLevel(privacySettings.value.activityVisibility),
        wallet_visibility: createVisibilityLevel(privacySettings.value.walletVisibility),
        analytics_enabled: privacySettings.value.analyticsEnabled,
        marketing_enabled: privacySettings.value.marketingEnabled,
        third_party_enabled: privacySettings.value.thirdPartyEnabled,
      }
      
      console.log('🔄 Converted to backend format:', backendSettings)
      
      await canisterService.updatePrivacySettings(backendSettings)
      
      console.log('✅ Privacy settings saved successfully')
      
      const toast = useToast()
      toast.add({
        title: 'Privacy Settings Updated',
        description: 'Your privacy settings have been saved successfully',
        color: 'success',
      })
    } catch (error) {
      console.error('❌ Failed to save privacy settings:', error)
      const toast = useToast()
      toast.add({
        title: 'Save Failed',
        description: 'Failed to save privacy settings. Please try again.',
        color: 'error',
      })
    } finally {
      saving.value = false
    }
  }

  const saveChanges = async () => {
    await savePrivacySettings()
  }

  const resetChanges = () => {
    // Reset privacy settings to defaults
    privacySettings.value = {
      profileVisibility: 'public',
      activityVisibility: 'public',
      walletVisibility: 'public',
      analyticsEnabled: true,
      marketingEnabled: false,
      thirdPartyEnabled: false,
    }
    savePrivacySettings()
  }

  const deleteAccount = async () => {
    if (
      !confirm(
        'Are you sure you want to delete your account? This action cannot be undone.'
      )
    ) {
      return
    }

    try {
      await canisterService.deleteAccount()

      const toast = useToast()
      toast.add({
        title: 'Account Deleted',
        description: 'Your account has been successfully deleted',
        color: 'success',
      })

      // Redirect to home page after account deletion
      await navigateTo('/')
    } catch (error) {
      console.error('Failed to delete account:', error)
      const toast = useToast()
      toast.add({
        title: 'Delete Failed',
        description: 'Failed to delete account. Please try again.',
        color: 'error',
      })
    }
  }

  const revealSeed = async () => {
    const session = appCacheService.getSession()
    const toast = useToast()
    
    if (!session || auth.nativeWallet !== 'local') {
      toast.add({
        title: 'Unable to retrieve seed',
        description: 'Not using Ionic wallet or no active session',
        color: 'error',
      })
      return
    }

    try {
      if (session.originalMnemonic) {
        // Prefer the exact mnemonic generated at login
        userSeed.value = session.originalMnemonic
        showSeed.value = true
      } else if (session.originalSignature?.startsWith('local-wallet-mnemonic-')) {
        // Extract the exact mnemonic embedded in signature
        const mnemonic = session.originalSignature.replace('local-wallet-mnemonic-', '')
        userSeed.value = mnemonic
        showSeed.value = true
        appCacheService.updateSession({ originalMnemonic: mnemonic })
      } else {
        // Do NOT reconstruct a new phrase from a hashed seed (would not match login phrase)
        throw new Error('No recovery phrase available in session')
      }
    } catch (error) {
      console.error('Failed to retrieve seed:', error)
      toast.add({
        title: 'Unable to retrieve seed',
        description: 'Recovery phrase unavailable in current session. Please re-login with Ionic wallet.',
        color: 'error',
      })
    }
  }

  const hideSeed = () => {
    showSeed.value = false
    userSeed.value = ''
  }

  const copySeed = async () => {
    try {
      await navigator.clipboard.writeText(userSeed.value)
      const toast = useToast()
      toast.add({
        title: 'Copied!',
        description: 'Recovery phrase copied to clipboard',
        color: 'success',
      })
    } catch (error) {
      console.error('Failed to copy seed:', error)
    }
  }

  const formatAddress = (address: string) => {
    if (!address) return ''
    if (address.startsWith('0x')) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`
    }
    if (address.startsWith('bc1')) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    if (address.length > 20) {
      return `${address.slice(0, 4)}...${address.slice(-4)}`
    }
    return address
  }

  // Get explicit theme color class to avoid Tailwind purging issues
  const getThemeColorClass = (theme: string) => {
    const colorClasses: Record<string, string> = {
      emerald: 'bg-emerald-500',
      pink: 'bg-pink-500',
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      sky: 'bg-sky-500',
      fuchsia: 'bg-fuchsia-500',
      purple: 'bg-purple-500',
      teal: 'bg-teal-500',
    }
    return colorClasses[theme] || 'bg-emerald-500'
  }

  // Lifecycle
  onMounted(async () => {
    // Ensure user is authenticated
    if (!auth.authenticated) {
      navigateTo('/')
      return
    }
    
    // Load privacy settings from backend
    await loadPrivacySettings()
  })
</script>
