import chokidar from "chokidar";
import simpleGit from "simple-git";
import path from "path";
import { exec } from "child_process";

const ICLOUD_DIR = `${process.env.HOME}/Library/Mobile Documents/com~apple~CloudDocs/Web4Sync`;
const REPO_DIR = `${process.env.HOME}/projects/web4-cloud`;
const TARGET_DIR = path.join(REPO_DIR, "icloud");

const git = simpleGit(REPO_DIR);

console.log("Web4 Sync Agent started");
console.log("Watching:", ICLOUD_DIR);

// Ensure rsync exists
const syncFiles = () => {
  exec(
    `rsync -av --delete "${ICLOUD_DIR}/" "${TARGET_DIR}/"`,
    async (err) => {
      if (err) return console.error("Sync error:", err.message);

      try {
        await git.add(".");
        await git.commit(`Auto-sync from iCloud (${new Date().toISOString()})`);
        await git.push();
        console.log("Synced & pushed to GitHub");
      } catch (e) {
        console.log("No changes to commit");
      }
    }
  );
};

const watcher = chokidar.watch(ICLOUD_DIR, {
  ignoreInitial: true,
  persistent: true,
});

watcher.on("all", () => {
  console.log("Change detected. Syncing...");
  syncFiles();
});
