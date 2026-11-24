# Respawn architecture (as of 2026-11-23)

This describes the old app (`ui/` plus the Python scripts) as it was before
the rebuild. The new `frontend/`, `backend/` and `shared/` folders are
described in [ROADMAP.md](ROADMAP.md). Open questions are at the end.

## What it does

Respawn is a desktop app that keeps versioned copies of game save folders.
The user registers a game by pointing at its save folder, then takes
snapshots (full copies with a timestamp) and restores any of them later.
Snapshots can have a text note. Cover art comes from the RAWG game database.

## Components

```
+--------------------------- Electron app (ui/) ----------------------------+
|                                                                            |
|  Renderer pages (HTML + inline JS, Tailwind from a CDN)                    |
|    index.html     game library, add-game wizard, recent snapshots          |
|    game.html      one game: snapshot list, restore, delete, notes          |
|    history.html   all snapshots across games                               |
|    settings.html  settings UI (stored, but not used yet; see below)        |
|        |                                                                   |
|        |  ipcRenderer.invoke(...)        localStorage <-- all app state    |
|        v                                                                   |
|  Main process (index.js)                                                   |
|    'run-python'      spawn python3 snapshot.py <command> <args...>         |
|    'switch-saves'    spawn python3 switch_saves.py <command> <args...>     |
|    'select-folder'   native folder picker                                  |
|    'get-config'      read ../config.json (RAWG API key)                    |
+--------|---------------------------------------------------------------- -+
         | one new process per call; arguments in argv; result = stdout text
         v
+---- Python scripts (repo root) ----+        +---- Filesystem -------------+
| snapshot.py                        | -----> | snapshots/<gameId>/         |
|   create / restore / list /        |        |   <YYYY-MM-DD_HH-MM-SS>/    |
|   delete / delete_game             |        |     (full copy of the save) |
| switch_saves.py                    | -----> | the game's own save folder  |
|   scan / running                   |        | Ryujinx data folder (read)  |
+------------------------------------+        +-----------------------------+
```

### Main process ↔ Python: how the processes talk

Every action starts a fresh `python3` process and waits for it to exit:

```
renderer --invoke('run-python','create',[id, path])--> main
main --spawn("python3 snapshot.py create <id> <path>")--> python
python --prints "2026-11-10_16-03-58" to stdout, exits--> main
main --resolves the promise with the trimmed stdout--> renderer
```

- Arguments go in `argv`. Results come back as plain text on stdout; only
  `switch_saves.py scan` prints JSON.
- There is no long-running Python process, no message protocol over
  stdin/stdout, and no auto-restart.
- `run-python` ignores the exit code and stderr. A failed restore or delete
  resolves like a success (the Python side also catches the exception and
  only prints it). `switch-saves` does reject on a non-zero exit.

### Storage

| What | Where | Notes |
|---|---|---|
| Game list (`id`, `name`, `path`, `coverUrl`, plus `platform`, `titleId`, `gameFile` for Switch games) | renderer `localStorage['respawn-games']` | `id` is `Date.now()` when the game was added |
| Snapshot notes | `localStorage['snapshot-notes-<id>']` | keyed by snapshot name |
| Which snapshot is "current" | `localStorage['current-snapshot-<id>']` | |
| Settings (snapshot dir, auto-cleanup, max snapshots) | `localStorage` | UI only: nothing reads them |
| Snapshots | `snapshots/<gameId>/<timestamp>/` next to `snapshot.py` | full `shutil.copytree`, no compression or dedup |
| RAWG API key | `config.json` (gitignored) | `config.example.json` is the template |

So the metadata lives in the renderer's browser storage and the data lives
on disk. They aren't kept in sync: deleting `snapshots/` leaves games in
the list, and clearing app data loses notes while the folders stay.

### Snapshot operations (snapshot.py)

- **create**: copies the save folder to `snapshots/<id>/<timestamp>`. The name
  has one-second resolution, so two snapshots in the same second collide
  and the second `copytree` fails.
- **restore**: `rmtree(save folder)` then `copytree(snapshot, save folder)`.
  This isn't atomic: if the copy fails partway, the live save is already gone.
- **list**: directory names sorted newest first.
- **delete** / **delete_game**: `rmtree` of one snapshot or a whole game.

### Switch support

- `switch_saves.py scan` reads Ryujinx's save index
  (`bis/system/save/8000000000000000/0/imkvdb.arc`) to map numbered save
  folders to title IDs, so the add-game wizard can list Switch saves by name.
  Tested only against a synthetic index file, not a real Ryujinx install.
- Restoring a Switch game's save is refused while a Ryujinx process is running.
- A "Play" button that launched Ryujinx was tried and set aside on the
  `experiment/play-beta` branch. It isn't part of the main app.

## Platforms

Developed and run on macOS. Nothing has been tested on Windows or Linux.
Things that could break there:
- `python3` is hard-coded (Windows usually has `python` or `py`).
- Snapshots are written inside the app's own folder, which won't be writable
  once the app is packaged.
- Python must be installed on the user's machine; nothing bundles it.
- The UI needs internet for Tailwind and Google Fonts (CDN), even offline.

## Tests and CI

None. `ui/package.json`'s `test` script is the npm placeholder. There is no
CI workflow. The Switch code was checked by hand with throwaway scripts.

## Leftovers

- `main.py`: the first UI (customtkinter). It calls the old `snapshot.py`
  functions without a game id, so it no longer works.
- `watcher.py`: empty. `venv/` has `watchdog` installed, so automatic
  snapshots on file change were apparently planned but never built.
- `ui/preload.js`: not loaded by any window, and its API uses the old
  signatures. The window runs with `nodeIntegration: true` and
  `contextIsolation: false`, so page scripts have full Node access. That's
  acceptable for local pages, but risky if remote content is ever loaded.
- `ui/save.txt` and the top-level `snapshots/<timestamp>/` folders are
  test data from before snapshots were stored per game.

## Answered by Gene (2026-11-23)

- Users today: 1 (Gene). This is the baseline for the user metric.
- Auto-snapshot on file change (`watcher.py`) is still planned.
- The frontend is moving to React. See [ROADMAP.md](ROADMAP.md).

## Still open

1. Whether it has ever run on Windows or Linux.
2. Whether the settings page is meant to work (custom snapshot folder,
   keep the last N snapshots) or is a mockup.
3. Which cloud provider and budget to plan the sync service around.
