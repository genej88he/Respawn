# Respawn framework plan

Status (2026-11-23): phase 1 done, phase 2 next. Live tracker: `docs/rebuild.html`. Today's code is described in
[ARCHITECTURE.md](ARCHITECTURE.md); the goals are in [CLAUDE.md](CLAUDE.md).

## Target stack

| Layer | Today | Target | Why |
|---|---|---|---|
| UI | 4 HTML pages with inline JS, Tailwind from a CDN | React + TypeScript, built with Vite, Tailwind installed through npm | Pages share cards, modals and lists that are copy-pasted today. Sync adds state (signed in, uploading, conflict) that components handle well. The npm build works offline; the CDN doesn't. |
| Desktop shell | Electron, `nodeIntegration` on, no preload | Electron with `contextIsolation` on, and a typed preload API | Pages lose direct Node access. One typed interface lists every call the UI can make. |
| Save engine | Python scripts, one process per call | TypeScript modules in Electron's main process | Removes the Python install requirement, which blocks real users (step 6). Errors become thrown exceptions instead of lost stderr. |
| App state | `localStorage` in the renderer | SQLite file in the user's app-data folder, owned by the main process | Sync needs one owner for metadata, and queries over versions. `localStorage` can't be read by the main process or a future sync worker. |
| File watcher | `watcher.py` (empty) | `chokidar` in the main process, debounced | Same language as the engine, and it works on macOS, Windows and Linux. |
| Tests | none | Vitest (engine and components), Playwright (whole app) | Vitest runs fast in CI. Playwright can drive a real Electron window. |
| CI | none | GitHub Actions on macOS, Windows and Linux | Catches the platform bugs listed in ARCHITECTURE.md. |
| Packaging | `npm start` from source | electron-builder | Friends need an installer, not a repo. |
| Cloud sync | none | designed in phase 5 | Decided on paper first, as the brief says. |

## How the pieces fit

```
+------------------------------- Electron app --------------------------------+
|                                                                             |
|  Renderer (React + TS)            preload (contextBridge)                   |
|  +---------------------------+    +----------------------------+            |
|  | pages: Library, Game,     |    | window.respawn = {         |            |
|  | History, Settings         | -> |   games.list(), add() ...  |            |
|  | components: GameCard,     |    |   snapshots.create(), ...  |            |
|  | SnapshotRow, Modal, ...   |    |   onEvent(cb)              |            |
|  +---------------------------+    | }  (typed, no raw Node)    |            |
|                                   +-------------|--------------+            |
|                                                 | ipcRenderer.invoke        |
|                                                 v                           |
|  Main process (Node + TS)                                                   |
|  +--------------------+  +-----------------+  +---------------------------+ |
|  | ipc/ handlers      |->| engine/         |->| filesystem                | |
|  | (validate input,   |  |  snapshot.ts    |  |  save folders             | |
|  |  call engine)      |  |  restore.ts     |  |  <userData>/snapshots/    | |
|  +--------------------+  |  watcher.ts     |  +---------------------------+ |
|                          |  switchSaves.ts |  +---------------------------+ |
|                          +--------|--------+  | <userData>/respawn.db     | |
|                                   +---------->| games, snapshots, notes   | |
|                                               +---------------------------+ |
+-----------------------------------------------------------------------------+
                         later (phase 5): sync/ module -> sync service
```

## Folder layout

Laid out like a Spring Boot + React project: `frontend/` is the React app,
and `backend/` is Electron's main process, layered as
controller → service → repository.

```
respawn/
├── frontend/                  React + TypeScript (Vite)  ~ your React app
│   └── src/
│       ├── pages/             Library, Game, History, Settings
│       ├── components/        GameCard, SnapshotRow, Modal, ...
│       ├── api/               thin wrapper over window.respawn  ~ axios client
│       └── main.tsx
├── backend/                   Electron main process (Node + TS)  ~ Spring Boot app
│   └── src/
│       ├── main.ts            starts the app, opens the window  ~ Application.java
│       ├── preload.ts         exposes window.respawn to the frontend
│       ├── controllers/       IPC handlers: validate input, call a service  ~ @RestController
│       ├── services/          snapshot, restore, watcher, switchSaves  ~ @Service
│       ├── repositories/      SQLite access for games, snapshots, notes  ~ DAO / JpaRepository
│       └── db/                schema and migrations
├── shared/                    types both sides import: DTOs and the IPC contract
├── server/                    phase 5: the cloud sync service (a real HTTP backend)
├── ARCHITECTURE.md  ROADMAP.md  CLAUDE.md
└── package.json
```

The one difference from a web project: here `backend/` isn't a server. It
runs on the user's machine, in the same app as the frontend, and they talk
through IPC instead of HTTP. The network backend is `server/`, which comes
in phase 5.

The rule: the renderer only draws and asks. Every file operation and all
state live in the main process, behind the preload API. That's the same
boundary a cloud client needs, so the sync module slots in beside the engine
without the UI changing much.

## Phases

Each phase ends with the app working and committed.

1. **Scaffold.** Vite + React + TypeScript renderer, typed preload, secure
   window settings, and Tailwind through npm with the current color tokens.
   The old pages keep working until they're replaced.
2. **Engine in TypeScript, with tests.** Port `snapshot.py` and
   `switch_saves.py`, fixing the bugs from ARCHITECTURE.md as we go: a
   restore that can't lose the live save (copy to a temp folder, then
   rename), errors that reach the UI, and unique snapshot names. Move state
   to SQLite, with a one-time import from `localStorage`. Unit tests use
   temporary folders.
3. **Pages in React.** Library, Game, History and Settings, in that order.
   Make Settings real: a custom snapshot folder and "keep last N". Then
   delete `main.py`, `preload.js`, the Python scripts and the HTML pages.
4. **Watcher, CI and packaging.** Automatic snapshots on save changes, with
   debounce and a cap. GitHub Actions on all three platforms. An
   electron-builder installer you can give a friend.
5. **Sync design on paper** (brief step 3), then the MVP, deployment and
   users (steps 4 to 7).

### Why the order differs from the brief

The brief puts tests and CI right after ARCHITECTURE.md. But tests written
now would be for Python code we're about to replace, so they'd be thrown
away. Writing them in phase 2, against the new engine, means they survive.
CI comes in phase 4, once there's a build worth running on three platforms.

## Not carried over

- **Play (beta), which launched Ryujinx.** Set aside on the
  `experiment/play-beta` branch, outside the main app. If it's ever tried
  again, test it with Dolphin (an open-source GameCube/Wii emulator) instead
  of Ryujinx.
- "Find Switch saves" is carried over. It's a save-manager feature (it reads
  Ryujinx's binary save index), not emulation.

## Numbers to collect (not measured yet)

- Users: 1 today (Gene).
- Save folder sizes for the games you actually use: they drive upload size
  and storage cost in the sync design.
- How often those saves change during a session: this tunes the watcher's
  debounce, and how many snapshots a day one user creates.
- Snapshot and restore time for each of those saves, before and after the
  port.
