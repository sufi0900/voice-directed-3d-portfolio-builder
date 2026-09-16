import { applySiteCommand, describeCommand, type CommandReceipt, type CommandSource, type SiteCommand } from "@/domain/commands";
import { DEFAULT_SITE_DOCUMENT, validateSiteDocument, type SiteDocument } from "@/domain/site-document";

export type StudioState = {
  past: SiteDocument[];
  present: SiteDocument;
  future: SiteDocument[];
  receipts: CommandReceipt[];
  selectedPanel: "content" | "design" | "scene";
  hydrated: boolean;
};

export type StudioAction =
  | { type: "hydrate"; document?: unknown }
  | { type: "execute"; command: SiteCommand; source: CommandSource }
  | { type: "undo"; source: CommandSource }
  | { type: "redo" }
  | { type: "selectPanel"; panel: StudioState["selectedPanel"] }
  | { type: "reset" };

export const initialStudioState: StudioState = {
  past: [], present: DEFAULT_SITE_DOCUMENT, future: [], receipts: [], selectedPanel: "content", hydrated: false,
};

export function studioReducer(state: StudioState, action: StudioAction): StudioState {
  switch (action.type) {
    case "hydrate": {
      let document = DEFAULT_SITE_DOCUMENT;
      if (action.document) {
        try { document = validateSiteDocument(action.document); } catch { document = DEFAULT_SITE_DOCUMENT; }
      }
      return { ...state, present: document, hydrated: true };
    }
    case "execute": {
      const next = applySiteCommand(state.present, action.command);
      if (next === state.present) return state;
      return {
        ...state,
        past: [...state.past.slice(-29), state.present],
        present: next,
        future: [],
        receipts: [...state.receipts.slice(-19), { command: action.command, source: action.source, summary: describeCommand(action.command, next), at: next.updatedAt }],
      };
    }
    case "undo": {
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
        receipts: [...state.receipts.slice(-19), { command: { type: "scene.focusSkill", skillId: previous.scene.focusedSkill }, source: action.source, summary: "Undid the previous change.", at: new Date().toISOString() }],
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return { ...state, past: [...state.past, state.present], present: next, future: state.future.slice(1) };
    }
    case "selectPanel": return { ...state, selectedPanel: action.panel };
    case "reset": return { ...initialStudioState, hydrated: true };
  }
}
