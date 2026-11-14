export const EDITOR_DRAFT_STATE_EVENT = "linkovne:editor-draft-state";

export const EDITOR_PUBLISHED_EVENT = "linkovne:editor-published";

export type EditorDraftState = {
  hasChanges: boolean;
  revision: number;
  saving: boolean;
  saveError: boolean;
  blockers: string[];
};
