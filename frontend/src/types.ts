type Action = "create" | "join" | "leave" | "chat" | "info";

export interface ILog {
  action: Action;
  isMine: boolean;
  token: string;
  createdAt: Date;
  message: string;
}

export interface IChat extends ILog {
  action: "chat";
}
