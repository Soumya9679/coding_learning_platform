/* ─── Shared Type Definitions ─────────────────────────────────────────── */

// ─── User & Auth ───────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  color: string;
  rarity?: string;
  category?: string;
}

export interface ProfileSubmission {
  id: string;
  challengeId: string;
  passed: boolean;
  xpAwarded: number;
  isRepeat: boolean;
  createdAt: string;
}

export interface Submission extends ProfileSubmission {
  code: string;
  stdout: string;
}

export interface ProfileData {
  uid: string;
  fullName: string;
  username: string;
  email: string;
  xp: number;
  rank: number;
  challengesCompleted: number;
  completedChallenges: string[];
  gamesPlayed: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string;
  createdAt: string;
  recentSubmissions: ProfileSubmission[];
  achievements: Achievement[];
  level?: UserLevel;
  achievementStats?: { total: number; unlocked: number; byRarity: Record<string, { total: number; unlocked: number }> };
}

export interface LeaderboardEntry {
  uid: string;
  rank: number;
  name: string;
  username: string;
  avatar: string;
  xp: number;
  challengesCompleted: number;
  gamesPlayed: number;
  streak: number;
}

export interface UserEntry {
  uid: string;
  fullName: string;
  email: string;
  username: string;
  xp: number;
  challengesCompleted: number;
  gamesPlayed: number;
  streak: number;
  role: string;
  lastActiveDate: string;
  createdAt: string;
}

// ─── Challenges ────────────────────────────────────────────────────────

export interface Challenge {
  id: string;
  tag: string;
  difficulty: number;
  title: string;
  description: string;
  criteria: string;
  mentorInstructions: string;
  rubric: string;
  steps: string[];
  starterCode: string;
  expectedOutput: string;
  retryHelp: string;
  order: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  tag: string;
  difficulty: number;
  starterCode: string;
  expectedOutput: string;
  criteria: string;
  steps: string[];
  authorId: string;
  authorUsername: string;
  status: string;
  plays: number;
  likes: number;
  createdAt: string;
}

export type OutputStatus = "idle" | "success" | "error" | "info";
export type OutputTab = "output" | "tests";

export interface TestResult {
  index: number;
  passed: boolean;
  value?: unknown;
  expected?: unknown;
  error?: string;
}

export interface Comment {
  id: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: string;
  likeCount: number;
  liked?: boolean;
  likes?: string[];
}

// ─── Duels ─────────────────────────────────────────────────────────────

export interface LobbyDuel {
  id: string;
  challengeTitle: string;
  difficulty: number;
  creatorUsername: string;
  timeLimit: number;
  createdAt: string;
}

export interface MyDuel {
  id: string;
  challengeTitle: string;
  difficulty: number;
  creatorUsername: string;
  opponentUsername: string | null;
  status: string;
  winnerId: string | null;
  winnerUsername: string | null;
  timeLimit: number;
  createdAt: string;
}

export interface ActiveDuel {
  id: string;
  challengeTitle: string;
  challengeDescription: string;
  expectedOutput: string;
  starterCode: string;
  difficulty: number;
  creatorId: string;
  creatorUsername: string;
  opponentId: string | null;
  opponentUsername: string | null;
  status: string;
  timeLimit: number;
  creatorPassed: boolean;
  opponentPassed: boolean;
  creatorFinishedAt: string | null;
  opponentFinishedAt: string | null;
  winnerId: string | null;
  winnerUsername: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  myCode: string;
  opponentCode: string;
}

// ─── Real-time Duel Extras ─────────────────────────────────────────────

export interface DuelPresence {
  uid: string;
  username: string;
  online: boolean;
  typing: boolean;
  lineCount: number;
  lastHeartbeat: string;
  connected: boolean;
}

export interface DuelChatMessage {
  id: string;
  uid: string;
  username: string;
  text: string;
  createdAt: string;
}

export type DuelStreamEvent =
  | { type: "duel_state"; data: ActiveDuel }
  | { type: "presence"; data: Record<string, DuelPresence> }
  | { type: "chat"; data: DuelChatMessage[] }
  | { type: "heartbeat"; data: { ts: string } }
  | { type: "error"; data: { message: string } };

export type LobbyStreamEvent =
  | { type: "lobby_update"; data: LobbyDuel[] }
  | { type: "heartbeat"; data: { ts: string } };

// ─── Learning Paths ────────────────────────────────────────────────────

export interface PathChallenge {
  id: string;
  title: string;
  difficulty: number;
  order: number;
}

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  color: string;
  challenges: PathChallenge[];
  total: number;
  completed: number;
  progress: number;
}

// ─── Admin ─────────────────────────────────────────────────────────────

export type AdminSortField =
  | "xp"
  | "challengesCompleted"
  | "gamesPlayed"
  | "streak"
  | "createdAt"
  | "username";

export interface Analytics {
  overview: {
    totalUsers: number;
    totalXp: number;
    avgXp: number;
    maxXp: number;
    maxStreak: number;
    maxChallenges: number;
    usersWithZeroXp: number;
    engagementRate: number;
  };
  xpDistribution: Record<string, number>;
  challengeDistribution: Record<string, number>;
  gameDistribution: Record<string, number>;
  streakDistribution: Record<string, number>;
  activityByDayOfWeek: { day: string; count: number }[];
  signupTrend: { date: string; count: number }[];
  challengeCompletions: { challengeId: string; completions: number }[];
}

export interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string;
  actorUid: string;
  targetType?: string;
  targetId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

// ─── Levels & Titles ──────────────────────────────────────────────────

export interface UserLevel {
  level: number;
  title: string;
  xpRequired: number;
  xpForNext: number;
  progress: number; // 0-100 within current level
  color: string;
  icon: string;
}

// ─── Notifications ─────────────────────────────────────────────────────

export type NotificationType =
  | "achievement_unlock"
  | "level_up"
  | "duel_invite"
  | "duel_result"
  | "streak_milestone"
  | "daily_challenge"
  | "follow"
  | "comment"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  color?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ─── Daily / Weekly Challenges ─────────────────────────────────────────

export interface DailyChallenge {
  id: string;
  challengeId: string;
  title: string;
  description: string;
  difficulty: number;
  starterCode: string;
  expectedOutput: string;
  type: "daily" | "weekly";
  xpMultiplier: number;
  activeDate: string;      // YYYY-MM-DD
  expiresAt: string;       // ISO date
  completedBy: number;     // count of users who completed it
  completed: boolean;      // current user completed?
}

// ─── Progress Dashboard ────────────────────────────────────────────────

export interface StreakDay {
  date: string;     // YYYY-MM-DD
  active: boolean;
  xpEarned: number;
}

export interface XpHistoryPoint {
  date: string;
  xp: number;
}

export interface ProgressStats {
  level: UserLevel;
  streakCalendar: StreakDay[];       // last 365 days
  xpHistory: XpHistoryPoint[];      // last 30 days
  xpBreakdown: {
    challenges: number;
    games: number;
    duels: number;
    daily: number;
    other: number;
  };
  completionRate: number;            // % of attempted challenges passed
  totalTimeSpent: number;            // minutes (estimated)
  bestStreak: number;
  currentStreak: number;
  weeklyXp: number;
  monthlyXp: number;
  recentMilestones: Notification[];  // last 5 achievement/level notifications
}
