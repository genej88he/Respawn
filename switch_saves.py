"""Find Nintendo Switch save folders made by the Ryujinx / Ryubing emulator.

Ryujinx keeps each game's save in a numbered folder:
    <data dir>/bis/user/save/<save id, 16 hex digits>/
The numbers say nothing about which game they belong to. The emulator's
save index, a small key-value file at
    <data dir>/bis/system/save/8000000000000000/0/imkvdb.arc
maps each save id to the game's title ID, so we read that file.

imkvdb.arc layout (little-endian):
    header: "IMKV", reserved u32, entry count i32
    each entry: "IMEN", key size i32, value size i32, key bytes, value bytes
    key   (SaveDataAttribute, 0x40): program id u64, user id 16 bytes,
          static save id u64, type u8, rank u8, index u16, padding
    value (SaveDataIndexerValue, 0x40): save data id u64, ...

Command line (used by the Electron UI):
    python3 switch_saves.py scan [data_dir]   -> JSON list of games found
    python3 switch_saves.py running           -> "yes" / "no" (emulator open?)
"""

import json
import os
import struct
import subprocess
import sys

SAVE_TYPE_ACCOUNT = 1  # a normal per-user game save
SAVE_TYPE_DEVICE = 3   # a save shared by all users on the console

# Names for title IDs we know, so the UI can show something friendlier than
# a hex number. Anything missing falls back to "Switch game <title ID>".
KNOWN_TITLES = {
    "0100152000022000": "Mario Kart 8 Deluxe",
    "01006a800016e000": "Super Smash Bros. Ultimate",
    "0100d2f00d5c0000": "Nintendo Switch Sports",
    "01007ef00011e000": "The Legend of Zelda: Breath of the Wild",
    "0100f2c0115b6000": "The Legend of Zelda: Tears of the Kingdom",
    "0100000000010000": "Super Mario Odyssey",
    "0100a3d008c5c000": "Pokémon Scarlet",
    "01008f6008c5e000": "Pokémon Violet",
    "01006f8002326000": "Animal Crossing: New Horizons",
    "0100c2500fc20000": "Splatoon 3",
}


def default_data_dirs():
    """Places Ryujinx and its forks keep their data on macOS, Linux and Windows."""
    home = os.path.expanduser("~")
    dirs = [
        os.path.join(home, "Library", "Application Support", "Ryujinx"),
        os.path.join(home, ".config", "Ryujinx"),
    ]
    appdata = os.environ.get("APPDATA")
    if appdata:
        dirs.append(os.path.join(appdata, "Ryujinx"))
    return dirs


def find_data_dir(explicit=None):
    candidates = [explicit] if explicit else default_data_dirs()
    for d in candidates:
        if d and os.path.isdir(os.path.join(d, "bis", "user", "save")):
            return d
    return None


def read_save_index(path):
    """Return {save id (16 hex): (title id (16 hex), save type)} from imkvdb.arc."""
    with open(path, "rb") as f:
        data = f.read()
    if len(data) < 12 or data[:4] != b"IMKV":
        raise ValueError("not an IMKV save index")
    (count,) = struct.unpack_from("<i", data, 8)
    pos = 12
    result = {}
    for _ in range(count):
        if data[pos:pos + 4] != b"IMEN":
            raise ValueError(f"bad entry at byte {pos}")
        key_size, value_size = struct.unpack_from("<ii", data, pos + 4)
        key = data[pos + 12:pos + 12 + key_size]
        value = data[pos + 12 + key_size:pos + 12 + key_size + value_size]
        pos += 12 + key_size + value_size
        if len(key) < 0x20 or len(value) < 8:
            continue
        (program_id,) = struct.unpack_from("<Q", key, 0)
        save_type = key[0x20]
        (save_id,) = struct.unpack_from("<Q", value, 0)
        result[f"{save_id:016x}"] = (f"{program_id:016x}", save_type)
    return result


def folder_size(path):
    total = 0
    for root, _, files in os.walk(path):
        for name in files:
            try:
                total += os.path.getsize(os.path.join(root, name))
            except OSError:
                pass
    return total


def scan(data_dir=None):
    """List the game saves in a Ryujinx data folder, newest first."""
    data_dir = find_data_dir(data_dir)
    if not data_dir:
        return {"dataDir": None, "games": []}

    save_root = os.path.join(data_dir, "bis", "user", "save")
    index_path = os.path.join(data_dir, "bis", "system", "save",
                              "8000000000000000", "0", "imkvdb.arc")
    index = {}
    if os.path.isfile(index_path):
        try:
            index = read_save_index(index_path)
        except (OSError, ValueError, struct.error):
            index = {}

    games = []
    for save_id in os.listdir(save_root):
        path = os.path.join(save_root, save_id)
        if not os.path.isdir(path):
            continue
        title_id, save_type = index.get(save_id.lower(), (None, None))
        if title_id is None:
            continue  # not in the index: unknown owner, skip it
        if save_type not in (SAVE_TYPE_ACCOUNT, SAVE_TYPE_DEVICE):
            continue  # system, cache and other non-game saves
        if title_id == "0" * 16:
            continue
        games.append({
            "titleId": title_id.upper(),
            "name": KNOWN_TITLES.get(title_id, f"Switch game {title_id.upper()}"),
            "path": path,
            "saveId": save_id,
            "sizeBytes": folder_size(path),
            "modified": os.path.getmtime(path),
        })
    games.sort(key=lambda g: g["modified"], reverse=True)
    return {"dataDir": data_dir, "games": games}


def emulator_running():
    """True if a Ryujinx/Ryubing process is open (restoring then is unsafe)."""
    try:
        if os.name == "nt":
            out = subprocess.run(["tasklist"], capture_output=True, text=True).stdout
            return "ryujinx" in out.lower()
        out = subprocess.run(["pgrep", "-if", "ryujinx"], capture_output=True, text=True)
        return out.returncode == 0
    except OSError:
        return False


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "scan"
    if command == "scan":
        print(json.dumps(scan(sys.argv[2] if len(sys.argv) > 2 else None)))
    elif command == "running":
        print("yes" if emulator_running() else "no")
    else:
        sys.exit(f"unknown command: {command}")
