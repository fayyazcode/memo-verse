# MOMOVERSE — COMPLETE GAME UI/UX REDESIGN
## Codex Implementation Prompt — Mobile-First HUD and Gameplay Interface

### ROLE

Act as a senior game UI/UX designer, frontend engineer, and game interface specialist.

You are working on an EXISTING playable 3D browser game called MomoVerse.

The user has provided a screenshot of the current mobile gameplay interface.

Your task is to redesign and improve the existing interface while preserving all game functionality, the green main character, voxel world, gameplay systems, and existing visual identity.

**This is an implementation task, not a design proposal.**

Do not rebuild the game or replace existing gameplay systems.

---

# 1. PRIMARY OBJECTIVE

Transform the existing interface into a polished, readable, responsive RPG game HUD with strong visual hierarchy, clear gameplay feedback, and intuitive mobile controls.

The new interface should feel like a modern fantasy adventure game rather than a collection of similarly styled website buttons.

Maintain the cozy, friendly visual direction, but introduce stronger contrast, purposeful colors, readable typography, and contextual UI.

The world should remain the visual focus.

---

# 2. EXISTING UI PROBLEMS

Analyze the attached screenshot and the actual UI implementation.

Known problems:

- Text is too small on mobile.
- Low contrast between text and panel backgrounds.
- Almost every component uses the same pale green/cream palette.
- Active missions are not visually emphasized.
- Quest progress is difficult to notice.
- Companion ability controls dominate the center of the screen.
- Health, XP, and companion information lack clear hierarchy.
- Interaction labels overlap other controls.
- Important and secondary buttons look too similar.
- Bottom navigation competes with gameplay controls.
- The interface occupies too much of the visible world.
- Disabled and locked abilities are not visually distinct.
- UI panels do not adapt well to smaller mobile screens.

Fix these problems systematically rather than changing colors randomly.

---

# 3. NEW DESIGN SYSTEM

## 3.1 Visual direction

Use a modern, cozy fantasy RPG interface.

Style:
- Soft rounded corners
- Subtle shadows
- Clean icons
- Strong typography
- Semi-opaque panels
- Selective glass effects
- Distinct interaction states
- Minimal decorative clutter

Avoid excessive transparency.

Avoid placing important text directly over bright or visually complex terrain.

## 3.2 Color palette

Use semantic colors.

**Primary interface background:** #172B27\
**Secondary surface:** #263D35\
**Light surface:** #F7F4E8\
**Primary text on dark:** #FFFFFF\
**Primary text on light:** #24352D\
**Secondary text on dark:** #C5D2CB\
**Primary action green:** #52C878\
**Quest gold:** #F4C95D\
**Combat red:** #E66A65\
**Companion blue:** #65B8F5\
**XP purple:** #A78BFA\
**Coins gold:** #F5B942\
**Warning orange:** #F59E52\
**Disabled gray:** #87938E

These are starting tokens. Adjust where necessary to meet contrast requirements.

Color must communicate meaning, not simply decorate components.

## 3.3 Semantic UI rules

- Green: Successful or available actions
- Gold: Active quests, rewards, objectives
- Red: Combat, danger, damage
- Blue: Companion actions and utility
- Purple: XP and progression
- Orange: Warnings and important alerts
- Gray: Disabled or unavailable actions

Never rely on color alone. Pair states with labels, icons, borders, or other indicators.

---

# 4. TYPOGRAPHY SYSTEM

The current interface uses text that is too small.

Implement a responsive typography scale.

Mobile minimums:

| UI Element | Target Size |
|---|---|
| Main panel title | 20–24px |
| Section heading | 18–20px |
| Primary body text | 16px |
| Button labels | 15–17px |
| Secondary information | 14px |
| Important numeric values | 18–24px |
| Quest objectives | 15–16px |
| Critical notifications | 17–20px |

Do not use text below 12px for essential information.

Aim for at least 14px for readable secondary gameplay information.

Use a clean, legible font such as Inter, Nunito Sans, or an existing suitable font.

Provide a user-adjustable UI scale:

- 90%
- 100%
- 115%
- 130%

Default mobile scale: 115%, subject to viewport fit.

Text must not overlap or clip when scaled.

Maintain WCAG AA text contrast where applicable.

---

# 5. NEW MOBILE HUD LAYOUT

Redesign the HUD around gameplay priority.

## Top-left

Compact player status panel:
- Character icon
- Player name
- Level
- Health bar
- XP bar

Health must be visually dominant over XP.

Do not display long numeric labels when a compact bar and tooltip/detail panel would suffice.

## Top-right

Compact utility controls:
- Map
- Settings
- Pause

Coins should appear as a small distinct gold currency indicator.

Do not use oversized cards for secondary information.

## Upper-middle / left

Active quest tracker.

This must be one of the most noticeable HUD elements when a mission is active.

## Bottom-left

Virtual movement joystick.

Keep it unobstructed and inside the safe area.

## Bottom-right

Gameplay action buttons:
- Attack
- Interact
- Jump
- Companion ability

Use distinct visual styling and ergonomic spacing.

## Bottom-center

Compact six-slot hotbar.

## Secondary navigation

Move inventory, quest journal, creature collection, settlement, and professions into a collapsible menu or expandable navigation drawer.

Do not permanently display every secondary action on the main gameplay screen.

---

# 6. ACTIVE QUEST TRACKER — HIGH PRIORITY

Create a visually prominent contextual mission tracker.

This is the most important change.

## 6.1 When a quest is active

Display a compact quest panel with:

- Gold quest icon
- Mission title
- Current objective
- Progress counter
- Progress bar where relevant
- Distance or direction indicator if available

Example:

**ACTIVE QUEST**

The Missing Crystals

Collect glowing crystals in Greenwood Forest

Progress: 3 / 5

The quest panel should use:
- Dark readable background
- Gold accent border
- Clear white text
- High-contrast progress bar
- Small quest icon
- Optional subtle animated highlight

Do not use an aggressive constant glow.

## 6.2 Quest state colors

Available quest: Neutral with gold icon

Active quest: Gold accent

Objective completed: Green checkmark

Ready to claim: Gold reward icon and clear action

Failed or blocked objective: Orange warning

Completed quest: Green success state

## 6.3 Quest interactions

Tapping the active quest should open the quest journal or objective details.

If multiple quests are active:
- Display one tracked quest.
- Allow cycling tracked quests.
- Preserve the selected tracked quest across saves where supported.

## 6.4 Quest completion animation

When an objective completes:
- Display a brief green checkmark.
- Update the objective counter.
- Play a subtle completion sound.
- Animate the progress bar.
- Show the next objective.

When the entire mission completes:
- Display a distinct completion banner.
- Show rewards.
- Provide a Claim Reward action when applicable.
- Prevent duplicate claims.

Use a reduced-motion alternative.

---

# 7. COMPANION HUD REDESIGN

The current companion panel is too large and occupies the center of the screen.

Replace it with a compact contextual companion interface.

## 7.1 Collapsed state

Display:
- Active creature portrait
- Creature name
- Level
- Health
- Ultimate charge

Example:

Zaplet — Lv. 3\
HP 65/65\
Ultimate 100%

## 7.2 Expanded state

When the player taps the companion panel:
- Open a small ability tray.
- Show available Q, E, and R abilities.
- Show cooldowns.
- Show locked abilities.
- Show squad switching controls.

On desktop, ability hotkeys may remain visible in a compact horizontal bar.

On mobile, prioritize touch-accessible ability buttons.

## 7.3 Ability states

**Ready**
- Strong elemental color
- Clear icon
- Readable label

**Cooldown**
- Darkened icon
- Numeric countdown
- Radial cooldown indicator

**Locked**
- Gray appearance
- Lock icon
- Required level

**Insufficient charge**
- Disabled ultimate
- Visible charge percentage

**Active**
- Brief feedback animation

## 7.4 Elemental colors

- Fire: Orange/red
- Water: Blue
- Earth: Green/brown
- Electric: Yellow
- Neutral: Gray

Use elemental colors only for creature abilities and related information.

---

# 8. ACTION BUTTONS

Redesign the mobile action buttons to communicate their purpose.

## Attack

- Red accent
- Crossed swords icon
- Large touch target
- Brief hit feedback

## Interact

- Green accent
- Hand icon
- Highlight when a valid NPC or object is nearby

## Jump

- Neutral light/dark styling
- Upward arrow icon

## Companion Ability

- Blue or elemental accent
- Creature ability icon
- Cooldown state

## Building Mode

When building mode is active:
- Replace combat actions with building controls.
- Display Place, Remove, Rotate, and Exit Build.
- Clearly indicate build mode.
- Show block placement validity.

Do not display incompatible combat and building actions simultaneously.

All interactive touch targets should be at least 44 × 44 CSS pixels, preferably 48 × 48 or larger for primary actions.

---

# 9. CONTEXTUAL UI SYSTEM

The interface should respond to what the player is doing.

Define explicit UI contexts:

- Exploration
- NPC Interaction
- Combat
- Gathering
- Building
- Crafting
- Shop
- Quest Completion
- Settlement Management
- Menu / Pause

## Exploration

Show minimal HUD.

## NPC Interaction

- Highlight the relevant NPC.
- Display the NPC name.
- Show a clear Talk button.
- Open readable dialogue.

## Combat

- Emphasize health and combat abilities.
- Display target health.
- Show damage feedback.
- Minimize unrelated panels.

## Gathering

- Display resource name.
- Show required tool or companion.
- Show gathering progress if applicable.

## Building

- Show selected block.
- Show placement preview.
- Display build controls.
- Show resource cost.

## Quest Completion

- Temporarily emphasize rewards.
- Minimize competing notifications.

Only one major contextual panel should dominate the screen at a time.

---

# 10. NOTIFICATIONS AND FEEDBACK

Create a consistent notification system.

## Types

- Quest updated
- Objective completed
- Mission completed
- Reward received
- Item collected
- Level up
- Creature leveled up
- Inventory full
- Crafting failed
- Building blocked
- Combat warning
- Settlement event

## Priority

**Critical:** Danger, defeat, save failure

**High:** Quest completion, level up, reward claim

**Medium:** Objective updates, crafting results

**Low:** Routine item collection

Do not show multiple large notifications simultaneously.

Queue or combine repeated low-priority messages.

Example:
Instead of displaying five separate wood notifications, show:

+5 Wood

## Animation

Use short transitions of approximately 150–300ms.

Avoid excessive bouncing, flashing, or permanent pulsing.

---

# 11. NPC DIALOGUE UI

Replace tiny or floating dialogue text with a readable interface.

On mobile:
- Use a bottom dialogue sheet.
- Display NPC portrait and name.
- Show dialogue text at 16px or larger.
- Use large response buttons.
- Allow scrolling for long conversations.
- Keep important choices visible.
- Prevent gameplay inputs while dialogue is open.

On desktop:
- Use a centered or lower-screen dialogue panel.

NPC interaction indicators must not overlap the movement joystick or action buttons.

---

# 12. MINIMAP AND NAVIGATION

Improve the minimap.

Requirements:
- Clear player marker
- Tracked quest objective
- NPC locations where relevant
- Creature habitats when discovered
- Outposts and settlement markers
- Distinct marker colors
- Tap to expand

Active quest objectives should have a gold marker.

Avoid displaying every marker at once.

Support marker filtering in the expanded map.

---

# 13. INVENTORY, QUESTS, AND SECONDARY MENUS

Create consistent menu styling.

Use:
- Clear headings
- Readable item names
- Distinct rarity colors
- Strong selected states
- Consistent spacing
- Touch-friendly controls
- Scrollable content
- Clear close/back controls

Inventory:
- Show item icons and quantities clearly.
- Highlight selected items.
- Distinguish quest items from ordinary materials.

Quest journal:
- Separate Active, Available, Completed.
- Highlight the tracked mission.
- Show objectives and rewards.
- Provide Track / Untrack controls.

Creature collection:
- Display creature portraits.
- Show level, role, health, and assignment.
- Distinguish squad members from settlement workers.

Settlement:
- Highlight active production.
- Show resource shortages.
- Show worker assignments and progress.

---

# 14. RESPONSIVE DESIGN

Implement responsive layouts for:

- Small phones: 320–375px wide
- Standard phones: 376–430px wide
- Large phones
- Tablets
- Desktop

Test portrait and landscape orientation.

## Safe areas

Respect:
- Display notches
- Status bars
- Browser toolbars
- Gesture navigation areas

Use CSS safe-area insets where appropriate.

## Layout rules

- No overlapping HUD elements.
- No text clipping.
- No horizontal scrolling in gameplay overlays.
- No controls outside the viewport.
- No interaction blocked by decorative layers.
- No full-width panels unnecessarily covering gameplay.
- Keep action buttons within comfortable thumb reach.

For very small screens, collapse secondary HUD elements automatically.

---

# 15. ACCESSIBILITY

Implement:

- High-contrast text
- Readable font scaling
- Reduced-motion setting
- Visible focus states
- Accessible button labels
- Keyboard navigation in menus
- Color-independent status indicators
- Appropriate screen-reader labels for non-canvas UI

Avoid relying on hover for essential interactions.

---

# 16. TECHNICAL IMPLEMENTATION

Use the existing project's framework and component architecture.

Do not introduce a new UI framework unless necessary.

If the project uses React and Tailwind, extend the current components and design tokens.

## Recommended structure

- GameHUD
- PlayerStatus
- ActiveQuestTracker
- CompanionStatus
- AbilityTray
- MobileControls
- Hotbar
- ContextualActionPanel
- NotificationManager
- NPCDialogue
- GameMenu
- Minimap
- SettingsPanel

These are conceptual components. Adapt to actual repository structure.

## State management

Reuse the existing gameplay state.

Do not create duplicate quest, health, inventory, or companion state.

UI components must subscribe to relevant game state rather than maintaining independent copies.

## Performance

- Avoid updating the entire HUD every animation frame.
- Throttle or select high-frequency values where appropriate.
- Keep animations GPU-friendly.
- Avoid expensive blur effects on low-quality graphics settings.
- Prevent unnecessary rerenders.
- Keep mobile controls responsive.

---

# 17. IMPLEMENTATION PHASES

## Phase 1 — UI Audit and Design Tokens

- Inspect existing HUD components.
- Identify overlaps and readability problems.
- Establish semantic colors.
- Establish typography scale.
- Establish spacing and sizing tokens.
- Preserve existing functionality.

## Phase 2 — Core HUD Redesign

- Player status
- Active quest tracker
- Coins
- Minimap
- Hotbar
- Utility controls

## Phase 3 — Mobile Controls

- Joystick
- Attack
- Interact
- Jump
- Companion abilities
- Build mode controls
- Safe-area layout

## Phase 4 — Contextual Gameplay UI

- NPC dialogue
- Gathering prompts
- Combat feedback
- Building interface
- Quest notifications

## Phase 5 — Secondary Menus

- Inventory
- Quest journal
- Creature collection
- Settlement dashboard
- Settings

## Phase 6 — Responsive Testing and Polish

- Mobile viewport testing
- Desktop testing
- Font scaling
- Accessibility
- Performance
- Regression testing

---

# 18. ACCEPTANCE CRITERIA

The redesign is complete only when:

1. Essential gameplay text is readable on mobile.
2. Active missions are immediately identifiable.
3. Quest objectives show clear progress.
4. Quest completion is visually distinct.
5. Companion abilities do not obstruct the center of the game.
6. Locked and available abilities are clearly different.
7. Attack, Interact, Jump, and Ability have distinct styles.
8. Mobile controls remain easy to reach.
9. HUD panels do not overlap.
10. NPC dialogue is readable.
11. The hotbar remains usable.
12. Building mode has contextual controls.
13. Menus are responsive.
14. The game world remains visible.
15. Existing gameplay functionality remains intact.
16. Existing save data remains compatible.
17. UI scale settings work.
18. Reduced-motion settings work.
19. Every visible control performs its intended action.
20. Automated and manual viewport tests pass.

---

# 19. TESTING REQUIREMENTS

Use the existing test framework.

Add or update tests for:
- Quest tracker state
- Quest completion notifications
- Companion ability states
- Locked ability display
- Cooldown rendering
- Menu input suppression
- Build mode controls
- Responsive layouts
- UI scaling
- Notification priority
- Keyboard accessibility

If Playwright is available, test at least:

- 360 × 800
- 390 × 844
- 430 × 932
- 768 × 1024
- 1280 × 720
- 1920 × 1080

Capture screenshots and inspect for overlaps, clipping, and unreadable text.

Test with long mission titles and increased UI scale.

---

# 20. FINAL CODEX EXECUTION INSTRUCTION

Inspect the existing MomoVerse UI implementation and the attached mobile screenshot.

Redesign the gameplay interface using the specification above.

Prioritize:

1. Larger, readable text.
2. Strong visual hierarchy.
3. Highlighted active quests and objectives.
4. Compact companion ability controls.
5. Distinct gameplay action buttons.
6. Responsive, nonoverlapping mobile layouts.
7. Context-aware HUD behavior.
8. Consistent visual feedback.

Preserve the cozy fantasy visual identity, but make important gameplay information unmistakable.

Do not rebuild the game.

Do not modify core gameplay rules unless necessary to fix a demonstrated UI integration issue.

Implement actual changes, run tests, inspect the results, and fix remaining layout problems.

**The final result should look and behave like a polished mobile RPG interface, not a collection of pale website cards over a 3D scene.**
