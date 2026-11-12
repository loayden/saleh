import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";

const backupPath = process.argv[2];
const restoreUrl = process.env.RESTORE_DATABASE_URL;
const sourceUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const restoreBinary = process.env.PG_RESTORE_BIN || "pg_restore";

function fail(message) {
  console.error(JSON.stringify({ event: "restore_drill_failed", message }));
  process.exit(1);
}

if (!backupPath || backupPath === "--help") {
  console.log("Usage: RESTORE_DATABASE_URL=... RESTORE_DRILL_CONFIRM=I_UNDERSTAND npm run backup:restore-drill -- backups/file.dump");
  process.exit(backupPath === "--help" ? 0 : 1);
}
if (!restoreUrl) fail("RESTORE_DATABASE_URL is required");
if (!sourceUrl) fail("DATABASE_URL or SUPABASE_DB_URL is required for source comparison");
if (restoreUrl === sourceUrl) fail("Restore target must not be the source database");
if (process.env.RESTORE_DRILL_CONFIRM !== "I_UNDERSTAND") fail("Set RESTORE_DRILL_CONFIRM=I_UNDERSTAND to acknowledge that the target database will be overwritten");
if (!(await stat(backupPath).catch(() => null))) fail("Backup file does not exist");

const result = spawnSync(restoreBinary, ["--exit-on-error", "--clean", "--if-exists", "--no-owner", "--no-privileges", "--dbname", restoreUrl, backupPath], { stdio: ["ignore", "pipe", "pipe"] });
if (result.error || result.status !== 0) fail(`pg_restore failed with exit code ${result.status ?? "unknown"}`);
console.log(JSON.stringify({ event: "restore_drill_completed", backup: backupPath, target: "configured restore target" }));
