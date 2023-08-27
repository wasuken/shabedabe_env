import { generateSHA256Hash } from './util';

export type Token = string;
export type RoomId = string;
export type Action = 'create' | 'join' | 'leave' | 'chat' | 'info';

// 二人までなので配列ではなく変数として管理
export interface IRoom {
  id: RoomId;
  users: [Token, Token?];
  roomLog: RoomLog;
}

export interface IBaseAction {
  action: Action;
  createdAt: Date;
  message: string;
}

// ログとして保存するフォーマット
export interface ILoggingAction extends IBaseAction {
  user: Token;
}

// ユーザーに見せるときにはtokenを隠して、
// userTokenHashとして変換して返却する
export interface IUserAction extends IBaseAction {
  // sha2を想定
  userHashToken: string;
}

export function convActionLToU(from: ILoggingAction): IUserAction {
  return {
    ...from,
    userHashToken: generateSHA256Hash(from.user),
  };
}

export type RoomLog = ILoggingAction[];

const short_topics = [
  '音楽',
  '旅行',
  'ニュース',
  '食事',
  'おやつ',
  '飲み物',
  'デザート',
  '買い物',
  '癖',
  '好きなこと',
  '嫌いなこと',
  '不満',
  'ゲーム',
  'アニメ',
];

const middle_topics = [
  '好きな音楽',
  '最近みたニュース',
  '尊敬する偉人',
  '最近食べたもの',
  '最近読んだ本',
  '体はどこから洗う？',
  '最近みたテレビ、動画',
  '旅行に行きたい場所',
  '旅行にいったこと',
  '死ぬまでに行きたい場所',
  '死ぬまでにやりたいこと',
  '最近嬉しかったこと',
  '暇なときよくやること',
];

export const topics = [...short_topics, ...middle_topics];
