import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join, parse, resolve } from "node:path";

const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const backupDirectory = resolve(process.env.BACKUP_DIR || "backups");
const dumpBinary = process.env.PG_DUMP_BIN || "pg_dump";
const restoreBinary = process.env.PG_RESTORE_BIN || "pg_restore";

function fail(message) {
  console.error(JSON.stringify({ event: "backup_failed", message }));
  process.exit(1);
}

function timestamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function ensureSafeDirectory(directory) {
  const root = parse(directory).root;
  if (directory === root || directory === resolve(".")) fail("BACKUP_DIR must be a dedicated backup directory");
}

async function pruneOldBackups() {
  if (process.env.BACKUP_PRUNE !== "true") return;
  const retentionDays = Number(process.env.BACKUP_RETENTION_DAYS || 14);
  if (!Number.isFinite(retentionDays) || retentionDays < 1 || retentionDays > 3650) fail("BACKUP_RETENTION_DAYS must be between 1 and 3650");
  const cutoff = Date.now() - retentionDays * 86_400_000;
  for (const name of await readdir(backupDirectory)) {
    if (!/^saleh-\d{8}T\d{6}Z\.dump$/.test(name)) continue;
    const filePath = join(backupDirectory, name);
    if ((await stat(filePath)).mtimeMs < cutoff) {
      await unlink(filePath);
      await unlink(`${filePath}.sha256`).catch(() => undefined);
      console.log(JSON.stringify({ event: "backup_pruned", file: name }));
    }
  }
}

if (!databaseUrl || databaseUrl.includes("YOUR-PASSWORD")) fail("DATABASE_URL or SUPABASE_DB_URL is required and must contain a real connection string");
ensureSafeDirectory(backupDirectory);
await mkdir(backupDirectory, { recursive: true });

const outputPath = join(backupDirectory, `saleh-${timestamp()}.dump`);
const dump = spawnSync(dumpBinary, ["--format=custom", "--no-owner", "--no-privileges", "--file", outputPath, databaseUrl], { stdio: ["ignore", "pipe", "pipe"] });
if (dump.error || dump.status !== 0) {
  await unlink(outputPath).catch(() => undefined);
  fail(`pg_dump failed with exit code ${dump.status ?? "unknown"}`);
}

const verify = spawnSync(restoreBinary, ["--list", outputPath], { stdio: ["ignore", "pipe", "pipe"] });
if (verify.error || verify.status !== 0) {
  await unlink(outputPath).catch(() => undefined);
  fail("pg_restore could not read the generated backup");
}

const digest = createHash("sha256").update(await readFile(outputPath)).digest("hex");
await writeFile(`${outputPath}.sha256`, `${digest}  ${outputPath}\n`, "utf8");
await pruneOldBackups();
console.log(JSON.stringify({ event: "backup_created", file: outputPath, checksum: digest, verified: true }));
