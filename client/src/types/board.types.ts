import type { Comment } from "./comment.types";

export type BoardSummary = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
};

export type BoardMember = {
  role: "OWNER" | "ASSIGNEE";
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type Card = {
  id: string;
  title: string;
  content: string;
  order: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  deadline: string | null;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
};

export type Column = {
  id: string;
  title: string;
  order: number;
  boardId: string;
  card: Card[];
  createdAt: string;
  updatedAt: string;
};

export type BoardDetail = {
  id: string;
  title: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    fullName: string;
    email: string;
  };
  members: BoardMember[];
  columns: Column[];
};

export type BoardActivityLog = {
  id: string;
  boardId: string;
  userId: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};

export type AddedMember = {
  id: string;
  userId: string;
  boardId: string;
  role: "OWNER" | "ASSIGNEE";
  joinedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
};
