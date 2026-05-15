// Helpers

let _uuidCounter = 0;
const uuid = (): string => crypto.randomUUID?.() ?? `test-uuid-${++_uuidCounter}`;

export const resetFixtures = (): void => {
  _uuidCounter = 0;
};

const redisPayload = (data: object): string => JSON.stringify(data);

const FIXED_DATE = new Date('2024-01-01').toISOString();

const FIXED_TIMESTAMP = new Date('2024-01-01').getTime();
const createDate = (): Date => new Date(FIXED_DATE);

const emptyArray = <T>(): ReadonlyArray<T> => [];

// Types

export type User = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  isTfaEnabled: boolean;
  tfaSecret: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: Date;
};

export type Column = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ColumnWithCards<T = unknown> = Column & { cards: ReadonlyArray<T> };

export type Board = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BoardWithColumns = Board & { columns: Column[] };
export type BoardSummary = Pick<Board, 'id' | 'title' | 'createdAt' | 'ownerId'>;
export type BoardWithDetails<T = unknown> = Board & {
  owner: { id: string; fullName: string; email: string };
  members: ReadonlyArray<BoardMember>;
  columns: ReadonlyArray<ColumnWithCards<T>>;
};

export enum Role {
  MEMBER = 'MEMBER',
  ADMIN = 'ADMIN',
}

export type BoardMember = {
  id: string;
  userId: string;
  boardId: string;
  role: Role;
  joinedAt: Date;
  user: { id: string; fullName: string; email: string };
};

export type Card = {
  id: string;
  title: string;
  content: string;
  columnId: string;
  order: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  deadline: Date | null;
  assigneeId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Comment = {
  id: string;
  content: string;
  cardId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

// User

const userBase = {
  fullName: 'Test User',
  email: 'test@example.com',
  password: 'hashed_password',
  isEmailVerified: true,
  isTfaEnabled: false,
  tfaSecret: null,
} as const;

export const userFixture = {
  build: (override: Partial<User> = {}): User => ({
    ...userBase,
    ...override,
    id: override.id ?? uuid(),
    createdAt: override.createdAt ?? createDate(),
    updatedAt: override.updatedAt ?? createDate(),
  }),

  buildMany: (count: number, override: Partial<User> = {}): User[] =>
    Array.from({ length: count }, () => userFixture.build(override)),

  withoutPassword: (): Omit<User, 'password'> => {
    const { password: _password, ...rest } = userFixture.build();
    return rest;
  },

  with2FA: (): User =>
    userFixture.build({
      isTfaEnabled: true,
      tfaSecret: 'JBSWY3DPEHPK3PXP',
    }),

  unverified: (): User =>
    userFixture.build({
      isEmailVerified: false,
    }),

  publicProfile: (): Pick<User, 'id' | 'fullName' | 'email'> => {
    const { id, fullName, email } = userFixture.build();
    return { id, fullName, email };
  },
};

// Activity Log

export const activityLogFixture = {
  build: (override: Partial<ActivityLog> = {}): ActivityLog => ({
    id: uuid(),
    userId: 'user-1',
    action: 'LOGIN',
    details: 'User logged in.',
    createdAt: createDate(),
    ...override,
  }),

  buildMany: (count: number, override: Partial<ActivityLog> = {}): ActivityLog[] =>
    Array.from({ length: count }, () => activityLogFixture.build(override)),
};

// Redis

export const redisFixture = {
  emailVerification: {
    fresh: redisPayload({ otpCode: '111222', magicToken: 'magic-token-abc', attempts: 0 }),
    oneAttemptUsed: redisPayload({ otpCode: '111222', magicToken: 'magic-token-abc', attempts: 1 }),
    exhausted: redisPayload({ otpCode: '111222', magicToken: 'magic-token-abc', attempts: 3 }),
  },
  passwordReset: {
    fresh: redisPayload({ otpCode: '555444', attempts: 0, sentAt: FIXED_TIMESTAMP }),
    exhausted: redisPayload({ otpCode: '555444', attempts: 3, sentAt: FIXED_TIMESTAMP }),
  },
};

// Token

export const tokenFixture = {
  accessToken: 'mock-access-token-xyz',
  refreshToken: 'mock-refresh-token-xyz',
  tempToken: 'mock-temp-2fa-token',
  magicToken: 'magic-token-abc',
  otpCode: '111222',
  resetCode: '555444',
  totpCode: '123456',
};

// Column

const columnBase = {
  title: 'To Do',
  order: 0,
  boardId: 'board-1',
} as const;

export const columnFixture = {
  build: (override: Partial<Column> = {}): Column => ({
    ...columnBase,
    ...override,
    id: override.id ?? uuid(),
    createdAt: override.createdAt ?? createDate(),
    updatedAt: override.updatedAt ?? createDate(),
  }),

  buildMany: (count: number, override: Partial<Column> = {}): Column[] =>
    Array.from({ length: count }, (_, i) => columnFixture.build({ title: `Column ${i + 1}`, order: i, ...override })),

  defaultColumns: (boardId: string): Column[] => [
    columnFixture.build({ id: 'col-todo', title: 'To Do', order: 0, boardId }),
    columnFixture.build({ id: 'col-inprogress', title: 'In Progress', order: 1, boardId }),
    columnFixture.build({ id: 'col-done', title: 'Done', order: 2, boardId }),
  ],
};

// Board

const boardBase = {
  title: 'Test Board',
  ownerId: 'user-1',
} as const;

export const boardFixture = {
  build: (override: Partial<Board> = {}): Board => ({
    ...boardBase,
    ...override,
    id: override.id ?? uuid(),
    createdAt: override.createdAt ?? createDate(),
    updatedAt: override.updatedAt ?? createDate(),
  }),

  buildMany: (count: number, override: Partial<Board> = {}): Board[] =>
    Array.from({ length: count }, () => boardFixture.build(override)),

  withColumns: (override: Partial<Board> = {}): BoardWithColumns => {
    const board = boardFixture.build(override);
    return { ...board, columns: columnFixture.defaultColumns(board.id) };
  },

  withDetails: <T = unknown>(override: Partial<Board> = {}): BoardWithDetails<T> => {
    const board = boardFixture.build(override);
    return Object.freeze({
      ...board,
      owner: { id: board.ownerId, fullName: 'Test User', email: 'test@example.com' },
      members: emptyArray<BoardMember>(),
      columns: columnFixture.defaultColumns(board.id).map((col) => ({
        ...col,
        cards: emptyArray<T>(),
      })),
    }) satisfies BoardWithDetails<T>;
  },

  summary: (override: Partial<Board> = {}): BoardSummary => {
    const { id, title, createdAt, ownerId } = boardFixture.build(override);
    return { id, title, createdAt, ownerId };
  },

  full: <T = unknown>(): Readonly<BoardWithDetails<T>> => {
    const board = boardFixture.withDetails<T>();
    const members = [boardMemberFixture.build({ boardId: board.id })];
    return Object.freeze({ ...board, members }) satisfies BoardWithDetails<T>;
  },
};

// Board Member

export const boardMemberFixture = {
  build: (override: Partial<BoardMember> = {}): BoardMember => ({
    ...override,
    id: override.id ?? uuid(),
    userId: override.userId ?? uuid(),
    boardId: override.boardId ?? 'board-1',
    role: override.role ?? Role.MEMBER,
    joinedAt: override.joinedAt ?? createDate(),
    user: override.user ?? { id: uuid(), fullName: 'Member User', email: 'member@example.com' },
  }),
};

// Card

const cardBase = {
  title: 'Test Card',
  content: 'Test Content',
  columnId: 'col-1',
  order: 0,
  priority: 'MEDIUM' as const,
  deadline: null,
  assigneeId: null,
};

export const cardFixture = {
  build: (override: Partial<Card> = {}): Card => ({
    ...cardBase,
    ...override,
    id: override.id ?? uuid(),
    createdAt: override.createdAt ?? createDate(),
    updatedAt: override.updatedAt ?? createDate(),
  }),

  buildMany: (count: number, override: Partial<Card> = {}): Card[] =>
    Array.from({ length: count }, (_, i) => cardFixture.build({ order: i, ...override })),
};

// comment

const commentBase = {
  content: 'Test comment',
  cardId: 'card-1',
  userId: 'user-1',
};

export const commentFixture = {
  build: (override: Partial<Comment> = {}): Comment => ({
    ...commentBase,
    ...override,
    id: override.id ?? uuid(),
    createdAt: override.createdAt ?? createDate(),
    updatedAt: override.updatedAt ?? createDate(),
  }),

  buildMany: (count: number, override: Partial<Comment> = {}): Comment[] =>
    Array.from({ length: count }, () => commentFixture.build(override)),
};

const fixtures = {
  user: userFixture,
  activityLog: activityLogFixture,
  redis: redisFixture,
  token: tokenFixture,
  column: columnFixture,
  board: boardFixture,
  boardMember: boardMemberFixture,
  card: cardFixture,
  comment: commentFixture,
};

export default fixtures;
