# Onboarding Tour System

This document explains the current onboarding tour system implementation for NFTropoly.

## Overview

The onboarding tour system uses **Intro.js** to create interactive guided tours for new users. It automatically starts for first-time visitors and can be manually triggered via a button.

## System Architecture

### Core Components

1. **`useOnboarding.ts`** - Main logic and state management
2. **`OnboardingTour.vue`** - Container component for the tour overlay
3. **`OnboardingTrigger.vue`** - Manual tour trigger UI
4. **Integration in `app.vue`** - Auto-start logic and component mounting

### Dependencies

- **`intro.js`** (v8.3.2) - Tour overlay library
- **`intro.js/introjs.css`** - Default Intro.js styles
- **Vue 3** - Component framework
- **Nuxt 4** - Application framework
- **localStorage** - Persistence for tour completion state

## Component Details

### 1. `useOnboarding` Composable

**Location**: `src/frontend/composables/useOnboarding.ts`

**Purpose**: Core logic for tour management and state

**Key Functions**:

- `shouldShowOnboarding` - Checks if user should see tour (first-time visitor)
- `startTour(tourName)` - Initializes and starts a specific tour
- `stopTour()` - Stops the current tour
- `completeOnboarding()` - Marks tour as completed
- `initOnboarding()` - Initializes onboarding state

**State Management**:

- Uses localStorage key: `'nftropoly-onboarding-completed'`
- Tracks completion status to avoid showing tour repeatedly

### 2. `OnboardingTour.vue` Component

**Location**: `src/frontend/components/onBoardingTour/OnboardingTour.vue`

**Purpose**: Container for Intro.js tour overlay

**Features**:

- Minimal wrapper component
- Exposes `stopTour` and `startTour` methods
- Handles cleanup on component unmount
- No visible UI - just manages tour lifecycle

**Exposed Methods**:

```typescript
defineExpose({
  stopTour,
  startTour,
})
```

### 3. `OnboardingTrigger.vue` Component

**Location**: `src/frontend/components/onBoardingTour/OnboardingTrigger.vue`

**Purpose**: Manual tour trigger UI

**Features**:

- "Start Tour" button in bottom-right corner
- Modal with available tour options
- Currently only "Registration Tour" is active
- Other tours (Marketplace, Portfolio, Trading) are disabled

### 4. Integration in `app.vue`

**Auto-start Logic**:

```typescript
// Auto-start onboarding tour for new users
if (shouldShowOnboarding.value) {
  setTimeout(() => {
    startTour('registration')
  }, 2000) // Small delay to ensure everything is loaded
}
```

**Component Mounting**:

```vue
<ClientOnly>
  <OnboardingTour ref="onboardingTourRef" />
</ClientOnly>
<ClientOnly>
  <OnboardingTrigger />
</ClientOnly>
```

## Tour Implementation

### Current Tour: "registration"

**Steps Defined**:

1. **Welcome Message** - General introduction
2. **Connect Wallet Button** - `.connect-wallet-btn` in Header
3. **Wallet Options** - Individual wallet buttons (Internet Identity, MetaMask, Phantom, Plug)
4. **Registration Modal** - `.registration-modal` container
5. **Profile Fields** - Username input, address fields
6. **Create Profile Button** - `.create-profile-btn`
7. **Completion** - Final congratulations message

**Target Elements**:

- `.connect-wallet-btn` - Header connect wallet button
- `#internet-identity-btn` - Internet Identity wallet button
- `#metamask-btn` - MetaMask wallet button
- `#phantom-btn` - Phantom wallet button
- `#plug-btn` - Plug wallet button
- `.registration-modal` - Registration modal container
- `#username-input` - Username input field
- `.create-profile-btn` - Create profile button

### Tour Configuration

**Intro.js Options**:

```typescript
intro.setOptions({
  steps: tourSteps,
  disableInteraction: false,
  exitOnOverlayClick: false,
  nextLabel: 'Next',
  hidePrev: true,
  dontShowAgain: false,
  doneLabel: 'Done',
  tooltipClass: 'custom-tooltip',
  highlightClass: 'custom-highlight',
  scrollToElement: true,
  scrollPadding: 50,
  overlayOpacity: 0.5,
  helperElementPadding: 10,
})
```

## User Flow

### Automatic Flow (New Users)

1. User visits site for first time
2. After 2 seconds, tour automatically starts
3. User progresses through registration steps
4. Tour completion is saved to localStorage
5. Tour won't show again unless localStorage is cleared

### Manual Flow (Any User)

1. User clicks "Start Tour" button in bottom-right corner
2. Tour selection modal opens
3. User selects "Registration Tour"
4. Tour starts and progresses through steps
5. Same completion logic applies

## CSS Requirements

The tour targets specific CSS classes that must exist in the application:

**Required Classes**:

- `.connect-wallet-btn` - Connect wallet button in Header
- `.registration-modal` - Registration modal container
- `.create-profile-btn` - Create profile button
- `#username-input` - Username input field
- `#internet-identity-btn`, `#metamask-btn`, `#phantom-btn`, `#plug-btn` - Wallet buttons

## State Persistence

**localStorage Key**: `'nftropoly-onboarding-completed'`

**Values**:

- `'true'` - User has completed onboarding
- `null` or not set - User hasn't completed onboarding

**Behavior**:

- New users (no localStorage entry) see tour automatically
- Returning users (localStorage = 'true') don't see tour
- Manual trigger works regardless of completion status

## Error Handling

**Known Issues Fixed**:

- Removed infinite loop in `checkLoginStatus` function
- Fixed stack overflow from undefined window properties
- Cleaned up unused reset functionality

**Current Error Prevention**:

- Server-side checks prevent Intro.js initialization
- Element existence checks before targeting
- Graceful fallbacks for missing elements

## Performance Considerations

- Tour only initializes on client-side
- Intro.js CSS imported globally in app.vue
- Tour starts with 2-second delay to ensure page load
- Component cleanup on unmount prevents memory leaks

## Testing

### Manual Testing

1. **New User**: Clear localStorage and refresh page
2. **Manual Trigger**: Click "Start Tour" button
3. **Completion**: Complete tour and verify localStorage is set
4. **Returning User**: Verify tour doesn't auto-start

### Development Testing

- Use browser dev tools to clear localStorage
- Test different screen sizes and themes
- Verify all target elements exist in DOM

## Future Enhancements

**Potential Improvements**:

- Add more tour types (marketplace, portfolio, etc.)
- Custom styling for different themes
- A/B testing for different tour flows
- Analytics integration for tour completion rates
- Mobile-specific tour optimizations

**Planned Features**:

- Marketplace tour for browsing and trading
- Portfolio tour for managing collections
- Advanced features tour for power users
