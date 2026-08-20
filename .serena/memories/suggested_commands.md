# Suggested Commands

## Dev server
```bash
# Start dev server (port8123)
python -m http.server 8123
# Or use the batch file:
启动mega-idle.bat
```

## Git (standard Windows git)
```bash
git status
git diff
git add -A
git commit -m "message"
```

## Windows-specific notes
- Use `python` (not `python3`) on Windows
- Paths use backslashes in batch files, forward slashes in JS
- `dir` works but `ls` via Git Bash or WSL also available

## Goal loop (autonomous quality loop)
```bash
# Start the autonomous quality loop (starts server + runs iterations)
goal-loop.bat
# Preview next iteration without running:
node loop-trigger.js --dry
```

## Tools directory
- `tools/vision-review.mjs` — vision review helper
- `tools/png-ascii.cjs` — PNG to ASCII art
- `tools/build-lora-dataset.cjs` — LoRA dataset builder

## Progress tracking
- `progress/improvement-log.md` — iteration history
- `progress/round-<N>-evidence.md` — evidence packs
- `progress/round-<N>-plan.md` — iteration plans
- `progress/goal-judge-<N>.md` — critic verdicts