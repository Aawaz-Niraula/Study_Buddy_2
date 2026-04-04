# Timer Feature Implementation

## Overview
Added comprehensive timer functionality to test-taking flow with auto-submit and color-coded time display.

## Features Implemented

### 1. Timer Selection (TestOptionsSheet)
- **3 Options Available:**
  - No Timer (default)
  - 2 Minutes
  - 4 Minutes

- **UI Design:**
  - Grid layout with 3 icon buttons
  - Clock icon for visual consistency
  - Purple highlight on selection
  - Integrated into test options bottom sheet

### 2. Timer Display (TestScreen)
- **Location:** Top-right header next to exit button
- **Display Format:** `M:SS` (e.g., 2:00, 1:45, 0:10)
- **Visual Design:**
  - Monospace font for consistent digit spacing
  - Clock icon next to time
  - Badge with border for emphasis
  - Smooth animation on mount

### 3. Color Coding
Timer color changes based on remaining time:
- **Green** (`text-green-400`): More than 50% time remaining
- **Yellow** (`text-yellow-400`): Less than 50% time remaining
- **Red** (`text-red-400`): 10 seconds or less remaining

Border also changes to red when ≤10 seconds for additional emphasis.

### 4. Auto-Submit Logic
- Countdown starts immediately when test begins
- Updates every second (1000ms interval)
- When timer reaches 0:
  1. Shows "Time is up!" message for 1.5 seconds
  2. Automatically submits test
  3. Navigates to results screen

### 5. State Management
- `timerMinutes`: Stores selected timer duration (null if no timer)
- `timeLeft`: Countdown in seconds (null if no timer active)
- `timeIsUp`: Boolean flag for "Time is up!" display
- Timer resets on test exit or new session

## Technical Implementation

### Files Modified
1. **components/TestOptionsSheet.tsx**
   - Added timer selection UI
   - Returns both scope and timer duration to parent
   - 3-column grid for timer options

2. **components/TestScreen.tsx**
   - Added timer display in header
   - Implemented countdown logic with useEffect
   - Added color coding based on time remaining
   - Auto-submit when timer expires
   - "Time is up!" message display

3. **app/page.tsx**
   - Added `timerMinutes` state
   - Updated `startTest` function signature
   - Passed timer prop to TestScreen
   - Reset timer on exit/new session

### Key Code Patterns

**Timer Countdown (useEffect):**
```typescript
useEffect(() => {
  if (timeLeft === null) return;
  
  if (timeLeft <= 0) {
    setTimeIsUp(true);
    setTimeout(() => onSubmit(), 1500);
    return;
  }

  const interval = setInterval(() => {
    setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
  }, 1000);

  return () => clearInterval(interval);
}, [timeLeft, onSubmit]);
```

**Color Coding Logic:**
```typescript
const getTimerColor = () => {
  if (timeLeft === null || timerMinutes === null) return "text-green-400";
  
  const totalSeconds = timerMinutes * 60;
  const percentRemaining = (timeLeft / totalSeconds) * 100;

  if (timeLeft <= 10) return "text-red-400";
  if (percentRemaining < 50) return "text-yellow-400";
  return "text-green-400";
};
```

## Responsive Design
- Timer fits neatly in header on mobile (compact badge)
- Scales appropriately on desktop
- Doesn't interfere with progress bar or exit button
- Flex layout automatically handles spacing

## Testing Checklist
- [x] Timer selection appears in test options
- [x] Timer displays correctly at top of test screen
- [x] Countdown updates every second
- [x] Color changes: green → yellow → red
- [x] "Time is up!" message displays
- [x] Test auto-submits after timeout
- [x] Timer resets on exit
- [x] "No timer" option works (no timer shown)
- [x] Works on mobile screen sizes
- [x] Works on desktop screen sizes

## User Flow
1. User taps "TAKE TEST" button
2. Bottom sheet appears with scope + timer options
3. User selects scope and timer duration
4. Taps "START TEST" button
5. Test screen loads with timer in header (if selected)
6. Timer counts down with color changes
7. At 0:00, shows "Time is up!" for 1.5s
8. Test auto-submits and shows results

## Edge Cases Handled
- No timer selected: Timer not displayed at all
- User exits test: Timer stops and resets
- User submits before timer expires: Timer stops
- Multiple test attempts: Timer resets each time
- Timer at 0: Prevents negative numbers
