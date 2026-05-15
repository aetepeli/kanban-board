export type leaveBoardPayload = {
  boardId: string;
};

export type joinBoardPayload = {
  boardId: string;
};

export type moveCardPayload = {
  boardId: string;
  cardId: string;
  toColumnId: string;
  fromColumnId: string;
  order: number;
};

export interface userPayload {
  userId: string;
  email: string;
  fullName: string;
}
