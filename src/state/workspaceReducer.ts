import {
  INITIAL_WORKSPACE_STATE,
  MAX_INPUT_SIZE,
  SIZE_ERROR_MESSAGE,
  type WorkspaceAction,
  type WorkspaceState,
} from "../domain/workspace";

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case "SET_INPUT": {
      const inputSize = action.text.length;
      const sizeError = inputSize > MAX_INPUT_SIZE ? SIZE_ERROR_MESSAGE : null;

      return {
        ...INITIAL_WORKSPACE_STATE,
        input: action.text,
        revision: state.revision + 1,
        inputSize,
        sizeError,
        isExample: false,
        schemaText: state.schemaText,
        schemaDiagnostics: state.schemaDiagnostics,
        mobilePanel: state.mobilePanel,
      };
    }

    case "CLEAR_INPUT": {
      return {
        ...INITIAL_WORKSPACE_STATE,
        schemaText: state.schemaText,
        schemaDiagnostics: state.schemaDiagnostics,
        mobilePanel: state.mobilePanel,
      };
    }

    case "SET_VALIDATING": {
      return { ...state, validationState: "validating" };
    }

    case "SET_VALIDATION": {
      if (action.revision !== state.revision) {
        return state;
      }
      return {
        ...state,
        validationState: "validated",
        diagnostics: action.diagnostics,
        eligibility: action.eligibility,
      };
    }

    case "SET_RESULT": {
      return { ...state, result: action.result, resultError: null };
    }

    case "SET_RESULT_TEXT": {
      if (!state.result) return state;
      return {
        ...state,
        result: { ...state.result, text: action.text },
      };
    }

    case "CLEAR_RESULT": {
      return { ...state, result: null, resultError: null };
    }

    case "SET_RESULT_ERROR": {
      return { ...state, resultError: action.error };
    }

    case "SET_REPAIR_ANALYSIS": {
      if (action.revision !== state.revision) {
        return state;
      }
      return {
        ...state,
        repairState: "ready",
        repairAnalysis: action.analysis,
      };
    }

    case "CLEAR_REPAIR": {
      return {
        ...state,
        repairState: "idle",
        repairAnalysis: null,
        repairValidation: null,
      };
    }

    case "SET_ANALYZING": {
      return { ...state, repairState: "analyzing", repairAnalysis: null };
    }

    case "SET_REPAIR_ACCEPTED": {
      return { ...state, repairState: "accepted" };
    }

    case "SET_SCHEMA_TEXT": {
      return { ...state, schemaText: action.text };
    }

    case "SET_SCHEMA_DIAGNOSTICS": {
      return { ...state, schemaDiagnostics: action.diagnostics };
    }

    case "SET_MOBILE_PANEL": {
      return { ...state, mobilePanel: action.panel };
    }

    case "SET_LOADED_STATE": {
      return action.state;
    }

    case "SET_EXAMPLE": {
      return { ...state, isExample: true };
    }

    case "SET_REPAIR_VALIDATION": {
      return { ...state, repairValidation: { valid: action.valid, id: action.id } };
    }

    case "CLEAR_WORKSPACE": {
      return { ...INITIAL_WORKSPACE_STATE, isExample: false };
    }

    default: {
      return state;
    }
  }
}
