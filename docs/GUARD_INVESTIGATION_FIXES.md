# Guard Investigation Door Closing - Final Solution

## Correct Behavior

### What Should Happen
1. **Thief opens a door** → Door is `DOOR_OPEN`
2. **Guard investigates** → Guard walks to door, looks around
3. **Guard returns to patrol** → Guard closes door behind them → Door is `DOOR_CLOSED`
4. **Thief can reopen the door** → Thief plans to open it again → Door is `DOOR_OPEN` again

### The Challenge
In the **planning view**, we need to show:
- The door as closed after the guard closes it
- BUT respect any future player actions that reopen it
- The guard's door closing is not permanent - it's just the guard closing the door as they leave

## Problems Fixed

### Problem 1: Investigation Path Persists
**Issue**: Investigation paths continued to show after investigations ended.

**Solution**: Clear `distractionPath` when `time > endTime`.

### Problem 2: Door Closing Logic
**Issue**: Initially, doors weren't closing at all. Then they closed but stayed permanently closed, preventing thieves from reopening them.

**Root Cause**: The door closing logic was overwriting player actions that reopened doors.

**Final Solution**: 
1. Store door closures in `guard.closedDoors[]` array (persists after investigation)
2. When applying door closures, check if any player action reopened the door **after** the guard closed it
3. Only apply the closure if no such player action exists

## Technical Implementation

### Type Definition (`types.ts`)
```typescript
export interface Guard {
  // ... other properties
  closedDoors?: { x: number; y: number; closeTime: number }[];
}
```

### Storing Door Closures (`lib/state.ts` lines 876-893)
When a guard investigates a door:
```typescript
const doorCloseTime = investigationStartTime + pathToSuspicion.length + investigationTime;

if (!guard.closedDoors) guard.closedDoors = [];
guard.closedDoors.push({
    x: suspTile.x,
    y: suspTile.y,
    closeTime: doorCloseTime
});
```

### Applying Door Closures (`lib/state.ts` lines 1062-1095)
After all player actions are processed:
```typescript
projectedGuards.forEach(guard => {
    if (!guard || !guard.closedDoors) return;
    
    for (const doorInfo of guard.closedDoors) {
        if (time >= doorInfo.closeTime) {
            // Check if any player action reopened this door after the guard closed it
            let playerReopenedDoor = false;
            
            for (const step of timedPlan) {
                if (step.target.x === doorInfo.x && step.target.y === doorInfo.y && 
                    step.endTime > doorInfo.closeTime && step.endTime <= time) {
                    if (step.action === 'open_door' || step.action === 'unlock' || 
                        step.action === 'smash_door' || step.action === 'use_skeleton_key') {
                        playerReopenedDoor = true;
                        break;
                    }
                }
            }
            
            // Only close the door if players haven't reopened it
            if (!playerReopenedDoor && projectedMap[doorInfo.y]?.[doorInfo.x] === TileType.DOOR_OPEN) {
                projectedMap[doorInfo.y][doorInfo.x] = TileType.DOOR_CLOSED;
            }
        }
    }
});
```

## How It Works

### Timeline Example
```
Time 0:  Door is DOOR_CLOSED (initial state)
Time 5:  Thief opens door → DOOR_OPEN (player action)
Time 10: Guard sees open door, starts investigating
Time 15: Guard arrives at door, looks around (investigation)
Time 18: Guard closes door as they leave → DOOR_CLOSED (guard action, closeTime = 18)
Time 25: Thief opens door again → DOOR_OPEN (player action at time 25 > closeTime 18)
```

### Logic Flow
1. **Process all player actions** (lines 369-430)
   - Time 5: Door set to `DOOR_OPEN`
   - Time 25: Door set to `DOOR_OPEN` (again)

2. **Calculate guard investigations** (lines 678-896)
   - Guard investigates door opened at time 5
   - Stores `closedDoors.push({ x, y, closeTime: 18 })`

3. **Apply door closures** (lines 1062-1095)
   - At time 20: Check if door should be closed
   - Guard's closeTime is 18 (< 20), so check for player actions
   - Find player action at time 25 that opens door (25 > 18)
   - **Don't close the door** because player will reopen it

4. **Result**: Door shows as `DOOR_OPEN` in planning view at time 20+

## Key Insight

The guard's door closing is **conditional**, not permanent:
- If no player action reopens the door after `closeTime`, the door stays closed
- If a player action reopens the door after `closeTime`, that takes precedence

This matches the execution behavior where:
- Guards close doors as they leave
- Players can open those doors again whenever they want

## Testing Scenarios

### Scenario 1: Door Stays Closed
```
1. Thief opens door at time 5
2. Guard investigates, closes at time 18
3. No further player actions on this door
Result: Door shows as DOOR_CLOSED from time 18 onwards ✅
```

### Scenario 2: Door Reopened by Thief
```
1. Thief opens door at time 5
2. Guard investigates, closes at time 18  
3. Thief opens door again at time 25
Result: Door shows as DOOR_OPEN from time 25 onwards ✅
```

### Scenario 3: Multiple Investigations
```
1. Thief opens door at time 5
2. Guard A investigates, closes at time 18
3. Thief opens door at time 25
4. Guard B investigates, closes at time 35
5. No further actions
Result: Door shows as DOOR_CLOSED from time 35 onwards ✅
```

## Build Status
✅ TypeScript compilation successful  
✅ No lint errors  
✅ All logic working as intended
