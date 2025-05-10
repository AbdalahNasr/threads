import * as React from "react";

// Define minimal types compatible with toast components
interface BaseToast {
  id: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  variant?: "default" | "destructive";
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  duration?: number;
  className?: string;
}

// Keep toast state type simple
interface ToastState {
  toasts: BaseToast[];
}

// Toast action types
const TOAST_ACTION = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

let toastCount = 0;

function generateId() {
  return (++toastCount).toString();
}

// Define action types
type ToastAction =
  | {
      type: typeof TOAST_ACTION.ADD_TOAST;
      toast: BaseToast;
    }
  | {
      type: typeof TOAST_ACTION.UPDATE_TOAST;
      toast: Partial<BaseToast> & { id: string };
    }
  | {
      type: typeof TOAST_ACTION.DISMISS_TOAST;
      toastId?: string;
    }
  | {
      type: typeof TOAST_ACTION.REMOVE_TOAST;
      toastId?: string;
    };

// Toast reducer
const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case TOAST_ACTION.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5),
      };

    case TOAST_ACTION.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case TOAST_ACTION.DISMISS_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          action.toastId === undefined || t.id === action.toastId
            ? { ...t, open: false }
            : t
        ),
      };

    case TOAST_ACTION.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };

    default:
      return state;
  }
};

// Simple toast state
const initialState: ToastState = {
  toasts: [],
};

// State listeners
const listeners: Array<(state: ToastState) => void> = [];
let memoryState = initialState;

// Dispatch function to update state
function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

// Toast function to create toasts
export type ToastOptions = Omit<BaseToast, "id" | "open" | "onOpenChange">;

export function toast(options: ToastOptions) {
  const id = generateId();
  
  const update = (props: Omit<ToastOptions, "id">) =>
    dispatch({
      type: TOAST_ACTION.UPDATE_TOAST,
      toast: { ...props, id },
    });

  const dismiss = () =>
    dispatch({ type: TOAST_ACTION.DISMISS_TOAST, toastId: id });

  dispatch({
    type: TOAST_ACTION.ADD_TOAST,
    toast: {
      ...options,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return {
    toast,
    dismiss: (toastId?: string) => dispatch({ type: TOAST_ACTION.DISMISS_TOAST, toastId }),
    toasts: state.toasts,
  };
}