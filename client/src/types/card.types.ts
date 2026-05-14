export type CardPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Card {
  id: string;
  title: string;
  content: string;
  order: number;
  priority: CardPriority;
  deadline: string | null;
  assigneeId: string | null;
  columnId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCardParams {
  title: string;
  content?: string;
  priority?: CardPriority;
  deadline?: string;
  assigneeId?: string;
  columnId: string;
  boardId: string;
}

export interface UpdateCardParams {
  columnId: string;
  cardId: string;
  title?: string;
  content?: string;
  priority?: CardPriority;
  deadline?: string;
  assigneeId?: string;
}

export interface DeleteCardParams {
  columnId: string;
  cardId: string;
  boardId: string;
}

export interface MoveCardParams {
  boardId: string;
  fromColumnId: string;
  toColumnId: string;
  cardId: string;
  newOrder: number;
  newIndex: number;
}
