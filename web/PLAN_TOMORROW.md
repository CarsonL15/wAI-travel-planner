# wAI Travel Planner - Development Plan

## Completed Today

### Calendar-Style Itinerary Editor
- [x] Week view calendar grid (6am-11pm, 15-minute increments)
- [x] Drag activities to move them between times and days
- [x] Resize activities by dragging top/bottom edges to change start/end times
- [x] Click empty space to add custom activities
- [x] Edit activity details in modal (title, time, category, location, notes)
- [x] Delete activities
- [x] View toggle between list view and calendar view
- [x] Category colors and icons for activity types
- [x] Undo/redo state management (reducer-based)

### Backend/Infrastructure Fixes
- [x] Fixed CORS errors on API Gateway (4XX, 5XX, timeout responses)
- [x] Added token refresh for expired Cognito sessions
- [x] Switched from Claude Sonnet to Claude Haiku for faster generation
- [x] Optimized AI prompt for faster responses
- [x] Added IAM permissions for Haiku model access

---

## To Complete Tomorrow

### 1. Regenerate with AI
- [ ] Add "Regenerate Itinerary" button to calendar view
- [ ] Option to regenerate full itinerary or specific days
- [ ] Pass current preferences (interests, pace, budget) to AI
- [ ] Show confirmation before overwriting existing activities
- [ ] Preserve any user-added custom activities (optional toggle)

### 2. Save Changes to Backend
- [ ] Create `updateItinerary` Lambda function
- [ ] Add PUT/PATCH endpoint to API Gateway
- [ ] Save button in UI to persist changes to DynamoDB
- [ ] **Autosave functionality** - debounced save after each edit (2-3 second delay)
- [ ] Visual indicator showing save status (Saved / Saving... / Unsaved changes)
- [ ] **User account persistence** - itineraries linked to user ID
- [ ] "My Trips" page to view/edit past itineraries
- [ ] Handle merge conflicts if editing on multiple devices

### 3. Loading/Error States (Make it Interesting!)
- [ ] **AI Generation Loading**
  - Animated travel-themed illustrations (plane flying, landmarks appearing)
  - Progress messages that update: "Finding the best restaurants...", "Discovering hidden gems...", "Planning your perfect day..."
  - Estimated time remaining or progress bar
  - Fun facts about the destination while waiting
- [ ] **Save Loading**
  - Subtle inline indicator (not blocking)
  - Success toast/notification
- [ ] **Error States**
  - Friendly error messages with retry buttons
  - Specific guidance based on error type (network, auth, timeout)
  - Fallback UI if data fails to load

---

## Future Enhancements (Backlog)
- [ ] Export to Google Calendar (ICS file or API integration)
- [ ] Collision detection UI (visual warning for overlapping activities)
- [ ] Auto-scroll when dragging near calendar edges
- [ ] Share itinerary with friends (read-only link)
- [ ] Collaborative editing
- [ ] Mobile-responsive calendar view
- [ ] Print-friendly itinerary export
