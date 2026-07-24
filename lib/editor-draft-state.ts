export const EDITOR_DRAFT_STATE_EVENT = "linkovne:editor-draft-state";

export type EditorDraftState = {
  hasChanges: boolean;
  saving: boolean;
  saveError: boolean;
  blockers: string[];
};
