import { create } from "zustand";
import type {
  LobbyDuel,
  MyDuel,
  ActiveDuel,
  DuelPresence,
  DuelChatMessage,
} from "./types";

/* ─── Real-time Duel State ───────────────────────────────────────────── */

type DuelView = "lobby" | "duel";

interface DuelState {
  /* — navigation — */
  view: DuelView;
  setView: (v: DuelView) => void;

  /* — lobby — */
  lobbyDuels: LobbyDuel[];
  myDuels: MyDuel[];
  lobbyLoading: boolean;
  setLobbyDuels: (d: LobbyDuel[]) => void;
  setMyDuels: (d: MyDuel[]) => void;
  setLobbyLoading: (b: boolean) => void;

  /* — active duel — */
  activeDuelId: string | null;
  activeDuel: ActiveDuel | null;
  setActiveDuelId: (id: string | null) => void;
  setActiveDuel: (d: ActiveDuel | null) => void;

  /* — real-time presence — */
  presence: Record<string, DuelPresence>;
  setPresence: (p: Record<string, DuelPresence>) => void;

  /* — real-time chat — */
  chatMessages: DuelChatMessage[];
  setChatMessages: (m: DuelChatMessage[]) => void;
  addChatMessage: (m: DuelChatMessage) => void;

  /* — editor state — */
  code: string;
  output: string;
  running: boolean;
  submitted: boolean;
  timeLeft: number;
  setCode: (c: string) => void;
  setOutput: (o: string) => void;
  setRunning: (b: boolean) => void;
  setSubmitted: (b: boolean) => void;
  setTimeLeft: (t: number) => void;

  /* — ui state — */
  tab: "open" | "mine";
  showCreate: boolean;
  showChat: boolean;
  timeLimit: number;
  actionLoading: boolean;
  setTab: (t: "open" | "mine") => void;
  setShowCreate: (b: boolean) => void;
  setShowChat: (b: boolean) => void;
  setTimeLimit: (n: number) => void;
  setActionLoading: (b: boolean) => void;

  /* — connection state (separate for lobby vs duel) — */
  lobbyConnected: boolean;
  lobbyReconnecting: boolean;
  duelConnected: boolean;
  duelReconnecting: boolean;
  setLobbyConnected: (b: boolean) => void;
  setLobbyReconnecting: (b: boolean) => void;
  setDuelConnected: (b: boolean) => void;
  setDuelReconnecting: (b: boolean) => void;

  /* — reset — */
  resetDuel: () => void;
  resetAll: () => void;
}

const initialDuelState = {
  code: "",
  output: "",
  running: false,
  submitted: false,
  timeLeft: 0,
  activeDuelId: null as string | null,
  activeDuel: null as ActiveDuel | null,
  presence: {} as Record<string, DuelPresence>,
  chatMessages: [] as DuelChatMessage[],
  showChat: false,
  lobbyConnected: false,
  lobbyReconnecting: false,
  duelConnected: false,
  duelReconnecting: false,
};

export const useDuelStore = create<DuelState>((set) => ({
  /* navigation */
  view: "lobby",
  setView: (view) => set({ view }),

  /* lobby */
  lobbyDuels: [],
  myDuels: [],
  lobbyLoading: true,
  setLobbyDuels: (lobbyDuels) => set({ lobbyDuels }),
  setMyDuels: (myDuels) => set({ myDuels }),
  setLobbyLoading: (lobbyLoading) => set({ lobbyLoading }),

  /* active duel */
  ...initialDuelState,
  setActiveDuelId: (activeDuelId) => set({ activeDuelId }),
  setActiveDuel: (activeDuel) => set({ activeDuel }),

  /* presence */
  setPresence: (presence) => set({ presence }),

  /* chat */
  chatMessages: [],
  setChatMessages: (chatMessages) => set({ chatMessages }),
  addChatMessage: (m) =>
    set((s) => ({
      chatMessages: [...s.chatMessages.slice(-99), m],
    })),

  /* editor */
  code: "",
  output: "",
  running: false,
  submitted: false,
  timeLeft: 0,
  setCode: (code) => set({ code }),
  setOutput: (output) => set({ output }),
  setRunning: (running) => set({ running }),
  setSubmitted: (submitted) => set({ submitted }),
  setTimeLeft: (timeLeft) => set({ timeLeft }),

  /* ui */
  tab: "open",
  showCreate: false,
  showChat: false,
  timeLimit: 300,
  actionLoading: false,
  setTab: (tab) => set({ tab }),
  setShowCreate: (showCreate) => set({ showCreate }),
  setShowChat: (showChat) => set({ showChat }),
  setTimeLimit: (timeLimit) => set({ timeLimit }),
  setActionLoading: (actionLoading) => set({ actionLoading }),

  /* connection (split: lobby vs duel) */
  lobbyConnected: false,
  lobbyReconnecting: false,
  duelConnected: false,
  duelReconnecting: false,
  setLobbyConnected: (lobbyConnected) => set({ lobbyConnected }),
  setLobbyReconnecting: (lobbyReconnecting) => set({ lobbyReconnecting }),
  setDuelConnected: (duelConnected) => set({ duelConnected }),
  setDuelReconnecting: (duelReconnecting) => set({ duelReconnecting }),

  /* reset */
  resetDuel: () => set(initialDuelState),
  resetAll: () =>
    set({
      ...initialDuelState,
      view: "lobby",
      lobbyDuels: [],
      myDuels: [],
      lobbyLoading: true,
      tab: "open",
      showCreate: false,
      timeLimit: 300,
      actionLoading: false,
    }),
}));
