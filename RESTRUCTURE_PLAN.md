# Major App Flow Restructuring

## Core Concept Changes

### OLD FLOW:
- Context-aware button (NEW SESSION / TAKE TEST / SEE RESULTS)
- Test mode activated from main button
- Mixed session/test history

### NEW FLOW:
- **NEW SESSION** button always visible (resets everything)
- **TAKE TEST** button in top-right menu
- **Left sidebar**: Session generations (multiple question sets from same source)
- **Right sidebar**: Test history only (tests taken)
- **Generate button**: Shows interactive Q&A with revealable answers

## Session Persistence

**A SESSION includes:**
- ONE source (text, PDF, or images)
- Multiple question generations from that source
- Different difficulties/formats allowed within same session

**NEW SESSION required when:**
- User wants to switch source (new text/PDF/image)
- User clicks "NEW SESSION" button

**Session persists until:**
- User manually clicks "NEW SESSION"
- User doesn't need to re-upload/re-enter for different question formats

## Sidebar Structure

### Left Sidebar (Session History Icon 📁)
- Shows all generations within current session
- Each card shows:
  - Generation number (#1, #2, etc.)
  - Time generated
  - Difficulty level
  - Question count
  - Format type
- Clicking a card loads that generation's interactive Q&A

### Right Sidebar (Clock Icon 🕐)
- Shows all test submissions across all sessions
- Each card shows:
  - Date/time
  - Score (e.g., "7/10 — 70%")
  - Color-coded badge (green/yellow/red)
  - Session source info
- Clicking a card opens full test review

## Main View States

### 1. Normal Session (Default)
- Session form at top
- Generate button creates interactive questions
- Questions display with "Reveal Answer" buttons
- Can generate multiple times with different settings
- All generations saved to left sidebar history

### 2. Test Mode (From menu "TAKE TEST")
- Opens test options sheet
- Generates test from session(s)
- One question at a time
- Submit test at end
- Results shown with score

### 3. Results View (After test submission)
- Animated score circle
- Question review cards
- RETAKE TEST and NEW SESSION buttons

## UI Improvements for Empty Sidebars

### Left Sidebar (Empty State):
- Icon: Sparkles
- Message: "No generations yet"
- Subtitle: "Generate questions from your current session to see them here"

### Right Sidebar (Empty State):
- Icon: Clock
- Message: "No tests taken yet"
- Subtitle: "Take a test to track your progress over time"

### Populated Sidebars:
- Rich cards with icons
- Color coding for active/inactive
- Clear visual hierarchy
- Smooth animations on interaction

## Key Component Changes

### New Components:
1. **GeneratedQuestionsView.tsx** - Interactive Q&A display with reveal buttons
2. **GenerationHistoryList.tsx** - Left sidebar content (session generations)

### Modified Components:
1. **TopBar.tsx** - Now has 3 icons (Session History, Test History, Menu)
2. **ContextAwareButton.tsx** - Simplified to just "NEW SESSION"
3. **TestHistoryList.tsx** - Enhanced design for right sidebar

### Main Page Flow:
1. **Normal mode**: Generate → View Q&A → Generate again with different settings
2. **Test mode**: Menu > Take Test → Test Options → Test Screen → Results
3. **Sidebar interactions**: Click generation/test → Load that view

## Implementation Tasks

- [ ] Create GeneratedQuestionsView component ✅
- [ ] Create GenerationHistoryList component ✅
- [ ] Update TopBar with 3 icons ✅
- [ ] Update ContextAwareButton to just NEW SESSION
- [ ] Refactor page.tsx state management:
  - Track current generation ID
  - Maintain generations array per session
  - Separate test history from session history
  - Add handlers for generation selection
- [ ] Update SessionForm to persist between generations
- [ ] Prevent source changes mid-session
- [ ] Update sidebar content rendering
- [ ] Enhance empty states
- [ ] Test complete flow

## Benefits

1. **Clearer mental model**: Session = one source, multiple generations
2. **Better organization**: Generations vs tests clearly separated
3. **Improved UX**: Can review all question sets from current session
4. **Enhanced learning**: Interactive Q&A encourages active recall
5. **Better test tracking**: Dedicated test history sidebar
