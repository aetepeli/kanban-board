import { Priority } from '.prisma/client';

export interface cardCreateParams {
  title: string;
  content: string;
  deadline: Date;
  priority?: Priority;
  boardId: string;
  columnId: string;
  userId: string;
  assigneeId?: string;
}

export interface cardUpdateParams {
  cardId: string;
  columnId: string;
  boardId: string;
  userId: string;
  title?: string;
  content?: string;
  deadline?: Date;
  priority?: Priority;
  assigneeId?: string;
}

export interface cardDeleteParams {
  cardId: string;
  columnId: string;
  boardId: string;
  userId: string;
}

export interface cardMoveParams {
  cardId: string;
  boardId: string;
  fromColumnId: string;
  toColumnId: string;
  newOrder: number;
  userId: string;
}
