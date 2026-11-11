import { getDatabase, type FolderRecord } from "@/lib/db";
import { fileHoldsProject, folderFileName, isFileOfProject, isSafeFolderFileName } from "@/lib/projects/folder-names";
import { getProject, listProjectItems, onProjectSaved } from "@/lib/projects/repository";
import { projectToJson } from "@/lib/projects/transfer";
import { createWriteQueue } from "@/lib/projects/write-queue";
import { useFolderSyncStore, type FolderSyncError, type FolderSyncPatch } from "@/store/folder-sync-store";

/** Quiet time after a save before the file is written, on top of the autosave's own delay. */
const FOLDER_WRITE_DELAY = 1500;

const RECORD_KEY = "autosave-folder";

type PermissionState = "granted" | "denied" | "prompt";
type PermissionOptions = { mode: "readwrite" };
/** The permission methods ship in Chromium but are not in TypeScript's DOM types. */
type PermissionedHandle = FileSystemDirectoryHandle & {
  queryPermission?: (options: PermissionOptions) => Promise<PermissionState>;
  requestPermission?: (options: PermissionOptions) => Promise<PermissionState>;
};
type DirectoryPicker = (options?: { id?: string; mode?: "read" | "readwrite" }) => Promise<FileSystemDirectoryHandle>;
type NameLister = { keys: () => AsyncIterable<string> };

const readwrite: PermissionOptions = { mode: "readwrite" };

/** True in browsers that can pick a writable folder (Chromium on a secure origin). Firefox and Safari: false. */
function folderSyncSupported(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && typeof pickerOf(window) === "function";
}

function pickerOf(target: Window): DirectoryPicker | undefined {
  return (target as Window & { showDirectoryPicker?: DirectoryPicker }).showDirectoryPicker;
}

class FolderError extends Error {
  constructor(readonly kind: FolderSyncError) {
    super(kind);
  }
}

let handle: PermissionedHandle | null = null;
let unsubscribe: (() => void) | null = null;
let initializing: Promise<void> | null = null;

const patchState = (patch: FolderSyncPatch) => useFolderSyncStore.getState().set(patch);

async function permission(target: PermissionedHandle, request: boolean): Promise<PermissionState> {
  // A handle without the methods (some stubs, older builds) is treated as writable.
  if (!target.queryPermission) return "granted";
  const current = await target.queryPermission(readwrite);
  if (current === "granted" || !request || !target.requestPermission) return current;
  return target.requestPermission(readwrite);
}

/** Removes files an earlier name of the project left behind, so a rename never duplicates it. */
async function removeStaleFiles(dir: FileSystemDirectoryHandle, projectId: string, keep: string): Promise<void> {
  const names: string[] = [];
  for await (const name of (dir as unknown as NameLister).keys()) names.push(name);
  for (const name of names) {
    if (name !== keep && isSafeFolderFileName(name) && isFileOfProject(name, projectId)) {
      await dir.removeEntry(name).catch(() => undefined);
    }
  }
}

/** Writes one project into the chosen folder. The only file names used come from `folderFileName`. */
async function writeProject(id: string): Promise<void> {
  if (!handle) return;
  const project = await getProject(id);
  if (!project) return;
  if ((await permission(handle, false)) !== "granted") throw new FolderError("denied");
  const name = folderFileName(project);
  if (!isSafeFolderFileName(name)) throw new FolderError("write");
  try {
    const file = await handle.getFileHandle(name, { create: true });
    // Reloading the app re-saves the open project; leave a file alone (a diff in version control, a sync upload) when nothing changed.
    const existing = await file.getFile().then(
      (f) => f.text(),
      () => "",
    );
    if (existing && fileHoldsProject(existing, project)) {
      await removeStaleFiles(handle, id, name).catch(() => undefined);
      return;
    }
    const writable = await file.createWritable();
    await writable.write(projectToJson(project));
    await writable.close();
    await removeStaleFiles(handle, id, name).catch(() => undefined);
  } catch (error) {
    // A folder deleted or moved while the app was open.
    throw new FolderError(error instanceof DOMException && error.name === "NotFoundError" ? "missing" : "write");
  }
}

const queue = createWriteQueue({
  write: writeProject,
  delay: FOLDER_WRITE_DELAY,
  onSuccess: () => {
    if (queue.size() <= 1) patchState({ status: "ready", lastSavedAt: Date.now(), error: null });
  },
  onError: (_key, error) => {
    const kind = error instanceof FolderError ? error.kind : "write";
    patchState(kind === "denied" ? { status: "needs-permission", error: null } : { status: "error", error: kind });
  },
});

/** Queues a project for writing. A no-op without a connected folder. */
function queueFolderSave(projectId: string): void {
  if (!handle) return;
  if (useFolderSyncStore.getState().status === "ready") patchState({ status: "saving" });
  queue.schedule(projectId);
}

async function connect(next: PermissionedHandle, state: "granted" | "needs-permission"): Promise<void> {
  handle = next;
  unsubscribe ??= onProjectSaved(queueFolderSave);
  patchState({
    status: state === "granted" ? "ready" : "needs-permission",
    folderName: next.name,
    error: null,
  });
}

/** Looks up the saved folder after a reload. Idempotent; call it from any component that shows the control. */
export function initFolderSync(): Promise<void> {
  initializing ??= (async () => {
    const supported = folderSyncSupported();
    patchState({ supported });
    if (!supported) {
      patchState({ loaded: true });
      return;
    }
    try {
      const db = await getDatabase();
      const record = await db?.handles.get(RECORD_KEY);
      if (record) {
        const granted = (await permission(record.handle as PermissionedHandle, false)) === "granted";
        await connect(record.handle as PermissionedHandle, granted ? "granted" : "needs-permission");
      }
    } catch {
      // Unreadable storage: the folder simply is not connected.
    }
    patchState({ loaded: true });
  })();
  return initializing;
}

async function saveRecord(next: FileSystemDirectoryHandle): Promise<void> {
  const db = await getDatabase();
  if (!db) throw new FolderError("write");
  const record: FolderRecord = { key: RECORD_KEY, handle: next, name: next.name, connectedAt: Date.now() };
  await db.handles.put(record);
}

/** Writes every project into the folder now. */
export async function saveAllToFolder(): Promise<void> {
  if (!handle) return;
  patchState({ status: "saving" });
  for (const project of await listProjectItems()) queue.schedule(project.id);
  await queue.flush();
}

/** Opens the browser's folder picker, remembers the choice and writes every project to it. Needs a user click. */
export async function chooseFolder(): Promise<void> {
  const picker = typeof window === "undefined" ? undefined : pickerOf(window);
  if (!picker) return;
  let picked: FileSystemDirectoryHandle;
  try {
    picked = await picker.call(window, { id: "designhub-projects", mode: "readwrite" });
  } catch (error) {
    // Closing the picker is not an error.
    if (error instanceof DOMException && error.name === "AbortError") return;
    patchState({ status: handle ? useFolderSyncStore.getState().status : "off", error: "pick" });
    return;
  }
  const next = picked as PermissionedHandle;
  if ((await permission(next, true)) !== "granted") {
    patchState({ error: "denied" });
    return;
  }
  try {
    await saveRecord(next);
  } catch {
    patchState({ error: "write" });
    return;
  }
  queue.clear();
  await connect(next, "granted");
  patchState({ lastSavedAt: null });
  await saveAllToFolder();
}

/** After a reload the browser may ask again before writing. Needs a user click. */
export async function allowFolderAccess(): Promise<void> {
  if (!handle) return;
  if ((await permission(handle, true)) !== "granted") {
    patchState({ status: "needs-permission", error: "denied" });
    return;
  }
  patchState({ status: "ready", error: null });
  await saveAllToFolder();
}

/** Stops writing and forgets the folder. The files already in it stay. */
export async function disconnectFolder(): Promise<void> {
  queue.clear();
  handle = null;
  unsubscribe?.();
  unsubscribe = null;
  patchState({ status: "off", folderName: null, lastSavedAt: null, error: null });
  try {
    const db = await getDatabase();
    await db?.handles.delete(RECORD_KEY);
  } catch {
    // Nothing left to clean up.
  }
}

/** Writes anything still waiting, for when the tab is hidden or closed. */
export function flushFolderSync(): void {
  if (handle) void queue.flush();
}
