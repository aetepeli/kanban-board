export interface createColumnParams {
  title: string;
  boardId: string;
  userId: string;
}

export interface deleteColumnParams {
  columnId: string;
  userId: string;
}

export interface updateColumnParams {
  columnId: string;
  boardId: string;
  userId: string;
  title?: string;
}
