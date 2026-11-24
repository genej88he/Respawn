import os
import shutil
import datetime
import sys

SNAPSHOT_DIR = os.path.join(os.path.dirname(__file__), "snapshots")

def get_game_snapshot_dir(game_id):
    game_dir = os.path.join(SNAPSHOT_DIR, str(game_id))
    os.makedirs(game_dir, exist_ok=True)
    return game_dir

def create_snapshot(game_id, save_folder_path):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    snapshot_path = os.path.join(get_game_snapshot_dir(game_id), timestamp)
    shutil.copytree(save_folder_path, snapshot_path)
    print(timestamp)
    return snapshot_path

def restore_snapshot(game_id, snapshot_name, save_folder_path):
    snapshot_path = os.path.join(get_game_snapshot_dir(game_id), snapshot_name)
    try:
        shutil.rmtree(save_folder_path)
        shutil.copytree(snapshot_path, save_folder_path)
        print(f"Restored snapshot: {snapshot_name}")
    except Exception as e:
        print(f"Restore failed: {e}")

def list_snapshots(game_id):
    game_dir = get_game_snapshot_dir(game_id)
    if not os.path.exists(game_dir):
        return []
    snapshots = os.listdir(game_dir)
    return sorted(snapshots, reverse=True)

def delete_snapshot(game_id, snapshot_name):
    snapshot_path = os.path.join(get_game_snapshot_dir(game_id), snapshot_name)
    try:
        shutil.rmtree(snapshot_path)
        print(f"Deleted snapshot: {snapshot_name}")
    except Exception as e:
        print(f"Delete failed: {e}")

def delete_game_snapshots(game_id):
    game_dir = os.path.join(SNAPSHOT_DIR, str(game_id))
    try:
        if os.path.exists(game_dir):
            shutil.rmtree(game_dir)
            print(f"Deleted all snapshots for game: {game_id}")
    except Exception as e:
        print(f"Delete game snapshots failed: {e}")

if __name__ == "__main__":
    command = sys.argv[1]

    if command == "create":
        create_snapshot(sys.argv[2], sys.argv[3])
    elif command == "restore":
        restore_snapshot(sys.argv[2], sys.argv[3], sys.argv[4])
    elif command == "list":
        snapshots = list_snapshots(sys.argv[2])
        print("\n".join(snapshots))
    elif command == "delete":
        delete_snapshot(sys.argv[2], sys.argv[3])
    elif command == "delete_game":
        delete_game_snapshots(sys.argv[2])