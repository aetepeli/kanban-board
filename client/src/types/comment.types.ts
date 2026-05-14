export interface Comment {
  id: string;
  content: string;
  cardId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

export interface CreateCommentParams {
  cardId: string;
  content: string;
  boardId: string;
}

export interface UpdateCommentParams {
  cardId: string;
  commentId: string;
  content: string;
}

export interface DeleteCommentParams {
  cardId: string;
  commentId: string;
}
