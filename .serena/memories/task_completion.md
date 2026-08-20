# Task Completion Workflow

## Verification protocol (every change)

###1. Serve & reload
```bash
python -m http.server 8123
# Hard reload with cache-bust: http://127.0.0.1:8123/?v=<timestamp>
```

###2. Browser testing
- Open browser tool (xd://browser), viewport 390×844 mobile + 1280×800 desktop
- Screenshot (`tab.screenshot`) and `inspect_image` the ACTUAL rendered game
- NEVER trust code-by-eye for art/UI — must verify in browser

###3. Exercise the change
- Click through affected UI
- Change state (localStorage via `tab.evaluate` if needed)
- Verify numbers/state transitions in `MG.game.state`
- Check console for errors (must be clean)

###4. Performance check
- No busy loops
- Intervals properly cleared
- No memory leaks in game loop

###5. Report
- What changed
- Screenshot evidence
- State evidence
- Remaining gaps

## Common checks
- localStorage save/load roundtrip
- Offline rewards calculation
- Battle simulation accuracy
- UI responsiveness at 390×844 viewport
- All numbers display correctly (萬/億 format)
- All text is zh-TW

## Quality bar
- Compare against Evil Hunter Tycoon polish level
- Visual juice, information density, satisfying idle loop
- Mobile UX must be smooth (touch targets ≥ 44px)
- Fantasy writing quality (original, not copied)

## Autonomous loop verification
When running via `goal-loop.bat`:
- Evidence pack: `progress/round-<N>-evidence.md`
- Plan: `progress/round-<N>-plan.md`
- Judge verdict: `progress/goal-judge-<N>.md`
- Must pass critic before advancing to next iteration