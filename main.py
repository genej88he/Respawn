import customtkinter as ctk
import os
from snapshot import create_snapshot, restore_snapshot, list_snapshots, delete_snapshot


# App appearance
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class RespawnApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window setup
        self.title("Respawn")
        self.geometry("500x600")

        # Currently watched folder
        self.save_folder = None
        self.current_snapshot = None
        self.build_ui()

    def build_ui(self):
        # Title
        self.label_title = ctk.CTkLabel(self, text="Respawn", font=ctk.CTkFont(size = 24, weight = "bold"))
        self.label_title.pack(pady = 20)

        # Current folder label
        self.label_folder = ctk.CTkLabel(self, text = "No folder selected")
        self.label_folder.pack(pady = 5)

        # Select folder button
        self.btn_folder = ctk.CTkButton(self, text = "Select Save Folder", command = self.select_folder)
        self.btn_folder.pack(pady = 10)

        # Snapshot button
        self.btn_snapshot = ctk.CTkButton(self, text= "Take Snapshot", command = self.take_snapshot)
        self.btn_snapshot.pack(pady = 10)

        # Snapshots lists label
        self.label_snapshots = ctk.CTkLabel(self, text = "Snapshots:")
        self.label_snapshots.pack(pady = 5)

        # Scrollalbe frame for snapshots
        self.snapshot_frame = ctk.CTkScrollableFrame(self, width = 400, height = 300)
        self.snapshot_frame.pack(pady = 10)

    def select_folder(self):
        from tkinter import filedialog
        folder = filedialog.askdirectory()
        if folder:
            self.save_folder = folder
            self.label_folder.configure(text = f"Watching: {folder}")
            self.refresh_snapshots()
    
    def take_snapshot(self): 
        if self.save_folder:
            snapshot_path = create_snapshot(self.save_folder)
            self.current_snapshot = os.path.basename(snapshot_path)
            self.refresh_snapshots()
        else:
            self.label_folder.configure(text = "Please select a folder first")

    def refresh_snapshots(self):
        # Clear current list
        for widget in self.snapshot_frame.winfo_children():
            widget.destroy()
        
        # Repopulate with latest snapshots
        for snapshot in list_snapshots():
            row = ctk.CTkFrame(self.snapshot_frame)
            row.pack(fill = "x", pady = 2)

            if snapshot == self.current_snapshot:
                ctk.CTkLabel(row, text = "🟢", width = 30).pack(side = "left", padx = 5)
            else:
                ctk.CTkLabel(row, text = "⚪", width = 30).pack(side = "left", padx = 5)

            ctk.CTkLabel(row, text = snapshot).pack(side = "left", padx = 10)
            ctk.CTkButton(row, text = "Restore", width = 80,
                command = lambda s = snapshot: self.restore(s)).pack(side = "right", padx = 10)
            ctk.CTkButton(row, text= "Delete", width=80, fg_color="red",
                command=lambda s=snapshot: self.delete_snapshot_ui(s)).pack(side="right", padx=5)

    def restore(self, snapshot_name):
        if self.save_folder:
            restore_snapshot(snapshot_name, self.save_folder)
            self.current_snapshot = snapshot_name
            self.refresh_snapshots()
            self.label_folder.configure(text = f"Restored: {snapshot_name}")
    def delete_snapshot_ui(self, snapshot_name):
        delete_snapshot(snapshot_name)
        if self.current_snapshot == snapshot_name:
            self.current_snapshot = None
        self.refresh_snapshots()

if __name__ == "__main__":
    app = RespawnApp()
    app.mainloop()