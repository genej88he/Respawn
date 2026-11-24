# Respawn: project brief for Claude Code

See [ARCHITECTURE.md](ARCHITECTURE.md) for what the code actually does today.
Verified against the code (2026-11-23):
- Stack: Electron (HTML + inline JS, Tailwind CDN) with Python scripts run as
  child processes. Developed on macOS only.
- Processes talk through one-shot `python3` spawns with argv in and stdout
  text out. There is no JSON stdin/stdout protocol and no auto-restart.
- No tests, no CI.

## Who I am and why this project

I'm Gene, a computer engineering student at UW, applying for summer 2027
internships (the summer before senior year). I'm targeting two tracks:

- General backend / SWE internships
- Systems and embedded Linux roles (I implemented virtual memory, processes,
  and file descriptors in the xk course kernel)

Respawn is the one portfolio project meant to show verified experience
building something with real users and real workloads. An Amazon engineer
told me this is the best way for an intern to stand out: build apps with real
users (even friends counts), learn cloud infrastructure, deployments,
automated testing and beta/staging stages, and practice system design by
designing each project yourself and comparing it against standard designs.

## Goal

Turn Respawn from a local tool into a deployed system with real users by
adding a cloud sync backend. Proposed architecture (a starting point, not a
decision):

```
Respawn client (desktop app)
      |  uploads snapshot
      v
Sync service (API + auth) -> Object storage (snapshots) -> Metadata DB
      |
      v
Restore on another machine / version history
```

Design problems this adds (good for system design practice): storage cost,
deduplicating similar snapshots, conflicts when two machines upload, large
upload sizes, auth, and failure handling.

## Work plan

1. Read the repo and write `ARCHITECTURE.md` describing what exists today.
   List anything you can't determine and ask me.
2. Add automated tests and CI (for example GitHub Actions).
3. Design the sync service on paper first: requirements, API, data model,
   rough capacity numbers, failure cases. I draft it, you review and
   challenge it.
4. Build an MVP: auth, upload, list, and restore snapshots.
5. Deploy to a cloud free tier with separate staging and production, config
   through environment variables, and basic logging and metrics.
6. Get real users (friends, gaming communities) and track usage.
7. Write resume bullets only from measured numbers.

Metrics to track: number of users, snapshots uploaded, storage used, latency,
error rate, uptime.

## Decisions and constraints

- Do not build a Switch emulator as part of this project. The scope is too
  large, and emulation has legal risk (Yuzu and Ryujinx were shut down in
  2024). If I want an emulator for learning, I'll do a small separate one
  such as CHIP-8.
- One finished project with real users is worth more than several
  half-finished ones.
- Keep the systems flavor where it fits (file handling, IPC, concurrency),
  since I'm also targeting systems roles.
- Never invent numbers. Use placeholders for anything I haven't measured, and
  tell me which numbers I need to collect.

## How to work with me

- Give facts and explain why an answer is correct, not just what to do.
- Use an ASCII diagram when explaining a concept I might be confused by.
- Don't agree with me automatically. Push back when I'm wrong, and stay
  consistent between answers.
- I've taken CSE 121 (TA), 311, 312, 332, 333, 344, 351, and 473, plus EE 215,
  so you don't need to explain basic data structures or OS concepts, but do
  explain cloud and deployment topics from scratch.
