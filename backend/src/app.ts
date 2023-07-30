import express from "express";
import fs from "fs";
import crypto from "crypto";
const app = express();
import { Request, Response } from "express";

type Token = string;
type RoomId = string;
// 削除は別ディレクトリへ移動する
type Action = "create" | "join" | "leave" | "chat" | "info";

// 二人までなので配列ではなく変数として管理
interface IRoom {
  id: RoomId;
  users: [Token, Token?];
  chatPath: string;
}

interface IUserAction {
  action: Action;
  user: Token;
}

interface IUserChatAction extends IUserAction {
  message: string;
}

type RoomLog = IUserAction[];

const roomMap: Map<string, IRoom> = new Map();

function createRoom(token: string, dirPath: string) {
  const id = crypto.randomUUID();
  const chatPath = `${dirPath}/${id}`;
  if (fs.existsSync(chatPath)) {
    return createRoom(token, chatPath);
  } else {
    const log: RoomLog = [
      {
        action: "create",
        user: token,
      },
      {
        action: "join",
        user: token,
      },
    ];
    fs.writeFileSync(chatPath, JSON.stringify(log));
  }
  roomMap.set(id, { id, users: [token, undefined], chatPath });
  return id;
}

// ルームに参加する/作成する
app.get("/api/room", (req: Request, res: Response) => {
  const token = req.headers["X-TOKEN"] as string;
  if (!token || token.length < 10 || token.length > 200) {
    res.status(400).json({ msg: "invalid token" });
    return;
  }
  const roomId = createRoom(token, "/chat");
  res.json({ roomId });
});

// TODO 簡単なユーザー認証を実装する
// 作成したユーザーと相手のユーザー
//  ルームのログを取得する
app.get("/api/room/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const token = req.headers["X-TOKEN"] as string;
  const room = roomMap.get(id);
  if (!room) {
    res.status(400).json({ msg: "not found room: " + id });
    return;
  }
  const [usera, userb] = room.users;
  const roomUserb = userb || false;
  // 部屋参加者以外は情報にアクセスさせない
  const auth = usera === token || roomUserb === token;
  const chatPath = room.chatPath;
  if (auth && chatPath) {
    const textj = fs.readFileSync(chatPath, "utf-8");
    const data = JSON.parse(textj);
    res.json(data);
  } else {
    res.status(400).json({ msg: "invalid room obj" });
  }
});

// ルームにActionを登録する
app.post("/api/room/:id/chat", (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, msg } = req.body;
  const chatPath = `/chat/${id}`;

  const textj = fs.readFileSync(chatPath, "utf-8");
  const data = JSON.parse(textj);
  res.json(data);
});

module.exports = app;
