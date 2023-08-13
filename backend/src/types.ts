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

const short_topics = [
  "音楽",
  "旅行",
  "ニュース",
  "食事",
  "おやつ",
  "飲み物",
  "デザート",
  "買い物",
  "癖",
  "好きなこと",
  "嫌いなこと",
  "不満",
  "ゲーム",
  "アニメ",
];

const middle_topics = [
  "好きな音楽",
  "最近みたニュース",
  "尊敬する偉人",
  "最近食べたもの",
  "最近読んだ本",
  "体はどこから洗う？",
  "最近みたテレビ、動画",
  "旅行に行きたい場所",
  "旅行にいったこと",
  "死ぬまでに行きたい場所",
  "死ぬまでにやりたいこと",
  "最近嬉しかったこと",
  "暇なときよくやること",
];

export const topics = [...short_topics, ...middle_topics];
