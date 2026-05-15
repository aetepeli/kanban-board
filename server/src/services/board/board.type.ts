export interface createBoardParams {
  title: string;
  userId: string;
}

export interface deleteBoardParams {
  boardId: string;
  userId: string;
}

export interface getBoardByIdParams {
  boardId: string;
  userId: string;
}

export interface addMemberParams {
  boardId: string;
  inviterId: string;
  email: string;
}

export interface removeMemberParams {
  boardId: string;
  requesterId: string;
  memberIdToRemove: string;
}

export interface checkUserAccessParams {
  boardId: string;
  userId: string;
}

export interface getBoardActivityLogParams {
  boardId: string;
  userId: string;
}
