export interface commentCreateparams {
  content: string;
  cardId: string;
  userId: string;
  boardId: string;
}

export interface commentUpdateParams {
  content: string;
  commentId: string;
  cardId: string;
  userId: string;
  boardId: string;
}

export interface commentDeleteParams {
  commentId: string;
  cardId: string;
  userId: string;
  boardId: string;
}
