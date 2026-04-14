import os
import shutil
import datetime
import sys

# Where we store all snapshots
SNAPSHOT_DIR = os.path.join(os.path.dirname(__file__), "snapshots")

def create_snapshot(save_folder_path):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    snapshot_path = os.path.join(SNAPSHOT_DIR, timestamp)
    shutil.copytree(save_folder_path, snapshot_path)
    print(f"Snapshot created: {timestamp}")
    return snapshot_path

def restore_snapshot(snapshot_name, save_folder_path):
    snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_name)
    try:
        shutil.rmtree(save_folder_path)
        shutil.copytree(snapshot_path, save_folder_path)
        print(f"Restored snapshot: {snapshot_name}")
    except Exception as e:
        print(f"Restore failed: {e}")

def list_snapshots():
    if not os.path.exists(SNAPSHOT_DIR):
        return []
    snapshots = os.listdir(SNAPSHOT_DIR)
    return sorted(snapshots, reverse=True)

def delete_snapshot(snapshot_name):
    snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_name)
    try:
        shutil.rmtree(snapshot_path)
        print(f"Deleted snapshot: {snapshot_name}")
    except Exception as e:
        print(f"Delete failed: {e}")

# Command line interface for Electron to call
if __name__ == "__main__":
    command = sys.argv[1]

    if command == "create":
        create_snapshot(sys.argv[2])
    elif command == "restore":
        restore_snapshot(sys.argv[2], sys.argv[3])
    elif command == "list":
        snapshots = list_snapshots()
        print("\n".join(snapshots))
    elif command == "delete":
        delete_snapshot(sys.argv[2])