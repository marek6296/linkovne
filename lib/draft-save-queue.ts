/** One write at a time. Superseded queued snapshots are skipped; an in-flight
 * request always finishes before the latest snapshot is written. */
export function createDraftSaveQueue() {
  let tail = Promise.resolve();
  let version = 0;
  return {
    invalidate() {
      return ++version;
    },
    isCurrent(revision: number) {
      return revision === version;
    },
    enqueue(revision: number, save: () => Promise<void>) {
      const task = tail.then(async () => {
        if (revision === version) await save();
      });
      // A failed request must not block a later retry.
      tail = task.catch(() => {});
      return task;
    },
  };
}
