# Mobile Summary Card Refactor - Implementation Plan

**Status:** ⬜ Not Started
**Last Updated:** 2024-06-22

## Objective

Refactor the summary card in the mobile trip planning view to provide a robust, user-friendly experience for expansion/minimization, discussion, and quick actions (FAB menu). Ensure the UI is compact, intuitive, and touch-friendly.

---

## Tasks

### 1. Card Expansion/Minimization Logic
- [ ] Only allow expansion/minimization by clicking the card header or a dedicated expand/collapse icon
- [ ] Prevent event propagation from inputs, FAB, and controls inside the expanded area
- [ ] Animate expansion/minimization for smooth UX
- [ ] Ensure only one card can be expanded at a time

### 2. Discussion UI & Refresh
- [ ] Integrate a compact, visually integrated discussion area in the expanded card
- [ ] Ensure comments appear immediately after posting (fix mapping/refresh logic)
- [ ] Support replies, edit, and delete for comments (if not already present)
- [ ] Limit visible comments to 2-3 by default, with a "Show more" option

### 3. Floating Action Button (FAB) Menu
- [ ] Add a FAB in the expanded card
- [ ] On FAB click, show a menu with:
    - [ ] Edit date range
    - [ ] See votes (detailed breakdown)
    - [ ] Change vote
    - [ ] Delete range
    - [ ] Hide/collapse range
- [ ] Ensure FAB and menu are touch-friendly and accessible

### 4. Visual/UX Polish
- [ ] Make the expanded card visually distinct but compact
- [ ] Ensure the discussion area and FAB do not crowd the card
- [ ] Polish animations and transitions
- [ ] Test on various mobile screen sizes

### 5. Testing & QA
- [ ] Test expansion/minimization on tap/click and keyboard
- [ ] Test comment posting, editing, and deletion
- [ ] Test FAB actions for all roles (owner, member, etc.)
- [ ] Test accessibility (screen reader, keyboard nav)
- [ ] Gather user feedback and iterate

---

**Implementation Lead:** AI Assistant
**Next Review:** After initial expansion logic refactor 