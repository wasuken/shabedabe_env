export type Token = string;
export type RoomId = string;
export type Action = "create" | "join" | "leave" | "chat" | "info";

// 二人までなので配列ではなく変数として管理
export interface IRoom {
  id: RoomId;
  users: [Token, Token?];
  chatPath: string;
}

export interface IUserAction {
  action: Action;
  user: Token;
  createdAt: Date;
}

export interface IUserChatAction extends IUserAction {
  message: string;
}

export type RoomLog = IUserAction[];
