type Action = "create" | "join" | "leave" | "chat" | "info";

export interface IServerLog {
  action: Action;
  userHashToken: string;
  createdAt: Date;
  message: string;
}

export interface IUserLog extends IServerLog {
  isMine: boolean;
}

export interface IChat extends IUserLog {
  action: "chat";
}
