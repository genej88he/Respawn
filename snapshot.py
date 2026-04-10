import os
import shutil
import datetime

# Store all snapshots
SNAPSHOT_DIR = os.path.join(os.path.dirname(__file__), "snapshots")

def create_snapshot(save_folder_path):
    # Create timestamp
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # Each snap shot gets its own folder inside snapshots/
    snapshot_path = os.path.join(SNAPSHOT_DIR, timestamp)

    # Copy the entire save folder into snapshot folder.
    shutil.copytree(save_folder_path, snapshot_path)

    print(f"Snapshot created: {timestamp}")
    return snapshot_path

def restore_snapshot(snapshot_name, save_folder_path):
    snapshot_path = os.path.join(SNAPSHOT_DIR, snapshot_name)

    # Delete current save folder
    shutil.rmtree(save_folder_path)

    # Copy snapshot back to save folder
    shutil.copytree(snapshot_path, save_folder_path)

    print(f"Restored snapshot: {snapshot_name}")

def list_snapshots():
    # Returns all snapshot names sorted newest first
    snapshots = os.listdir(SNAPSHOT_DIR)
    return sorted(snapshots, reverse=True)
