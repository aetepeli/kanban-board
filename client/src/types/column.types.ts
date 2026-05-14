export interface Column {
  id: string;
  title: string;
  order: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnParams {
  boardId: string;
  title: string;
}

export interface UpdateColumnParams {
  boardId: string;
  columnId: string;
  title: string;
}

export interface DeleteColumnParams {
  boardId: string;
  columnId: string;
}
