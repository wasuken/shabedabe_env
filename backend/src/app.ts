import express from "express";
import fs from "fs";
import crypto from "crypto";
const app = express();
import { Request, Response } from "express";
const bodyParser = require("body-parser");
// urlencodedとjsonは別々に初期化する
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
// 部屋の最新更新日
const roomLastUpdateMap: Map<RoomId, number> = new Map();

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
  createdAt: Date;
}

interface IUserChatAction extends IUserAction {
  message: string;
}

type RoomLog = IUserAction[];

// TODO ここらへんの入れ替え処理は別プロセスにしたほうがいいかもredisとかで
//
// チャット部屋変数
const roomMap: Map<RoomId, IRoom> = new Map();
// ユーザー部屋参加変数
const userRoomMap: Map<Token, RoomId> = new Map();
// 参加待部屋変数
const waitRooms: string[] = [];

function createRoom(token: string, dirPath: string) {
  const id = crypto.randomUUID();
  const chatPath = `${dirPath}/${id}`;
  if (fs.existsSync(chatPath)) {
    return createRoom(token, chatPath);
  } else {
    const d = new Date();
    const log: RoomLog = [
      {
        action: "create",
        user: token,
        createdAt: d,
      },
      {
        action: "join",
        user: token,
        createdAt: d,
      },
    ];
    fs.writeFileSync(chatPath, JSON.stringify(log));
  }
  roomMap.set(id, { id, users: [token, undefined], chatPath });
  userRoomMap.set(token, id);
  waitRooms.push(id);
  return id;
}

// そこそこ長いので関数化
// Goみたいな書き方してる
// ここではTSの言葉で話せ
function joinRoom(token: string): [string, boolean, string] {
  // 待機部屋あるなら参加
  const roomId = waitRooms.pop();
  if (!roomId) {
    return ["", true, "system error: waitRooms illegal"];
  }
  const room = roomMap.get(roomId);
  if (!room) {
    return ["", true, "system error: not found room id."];
  }
  const [a] = room.users;
  room.users = [a, token];
  roomMap.set(roomId, room);
  userRoomMap.set(token, roomId);
  const chatPath = `/chat/${room.id}`;

  const textj = fs.readFileSync(chatPath, "utf-8");
  let data = JSON.parse(textj);
  const d = new Date();
  data = [
    ...data,
    {
      action: "join",
      user: token,
      createdAt: d,
    },
  ];
  fs.writeFileSync(room.chatPath, JSON.stringify(data));
  return [roomId, false, ""];
}

function getRoomInfo(token: Token): IRoom | null {
  const id = userRoomMap.get(token);
  if (!id) {
    // res.status(400).json({ msg: "not found room: " + id });
    return null;
  }
  const room = roomMap.get(id);
  if (!room) {
    // res.status(400).json({ msg: "not found room: " + id });
    return null;
  }
  return room;
}

function genRoomMapTableHTML() {
  const keys = Array.from(roomMap.keys());
  let roomListS = "";
  for (const k of keys) {
    const room = roomMap.get(k);
    if (room) {
      const [a, bb] = room?.users;
      const b = bb || "empty user";
      roomListS += `
        <tr>
          <td>${room.id}</td>
          <td>${a}</td>
          <td>${b}</td>
          <td>${room.chatPath}</td>
        </tr>
      `;
    }
  }
  return `
    <h2>roomMap</h2>
    <table>
     <thead>
       <tr>
         <th>room id</th>
         <th>userA</th>
         <th>userB</th>
         <th>chatPath</th>
       </tr>
     </thead>
     <tbody>
      ${roomListS}
     </tbody>
    </table>
  `;
}
function genWaitRoomHTML() {
  const rooms = waitRooms.map((r) => `<li>${r}</li>`).join("");
  return `
  <h2>Wait Rooms</h2>
   <ul>
   ${rooms}
   </ul>
  `;
}
function genUserRoomMapTableHTML() {
  let userRoomPairS = "";
  let keys = Array.from(userRoomMap.keys());
  for (const k of keys) {
    const rid = userRoomMap.get(k);
    if (rid) {
      userRoomPairS += `
        <tr>
          <td>${k}</td>
          <td>${rid}</td>
        </tr>
      `;
    }
  }
  return `
    <h2>userMap</h2>
    <table>
     <thead>
       <tr>
         <th>user token</th>
         <th>room id</th>
       </tr>
     </thead>
     <tbody>
      ${userRoomPairS}
     </tbody>
    </table>
  `;
}

function genLastUpdateRoomHTML() {
  let roomLastUpdatePairS = "";
  let keys = Array.from(roomLastUpdateMap.keys());
  for (const k of keys) {
    const rid = roomLastUpdateMap.get(k);
    if (rid) {
      roomLastUpdatePairS += `
        <tr>
          <td>${k}</td>
          <td>${rid}</td>
        </tr>
      `;
    }
  }
  return `
    <h2>roomLastUpdateMap</h2>
    <table>
     <thead>
       <tr>
         <th>room id</th>
         <th>last update</th>
       </tr>
     </thead>
     <tbody>
      ${roomLastUpdatePairS}
     </tbody>
    </table>
  `;
}

app.get("/api/room/map", (req: Request, res: Response) => {
  res.send(`
           <head>
           <link rel="stylesheet" type="text/css" href="/table.css" />
           </head>
           <body>
           <a href="/api/reset">reset</a>
           <hr />
           ${genRoomMapTableHTML()}
           <hr />
           ${genUserRoomMapTableHTML()}
           <hr />
           ${genLastUpdateRoomHTML()}
           <hr />
           ${genWaitRoomHTML()}
           <hr />
           </body>
           `);
});
app.get("/api/reset", (_req: Request, res: Response) => {
  roomMap.clear();
  userRoomMap.clear();
  roomLastUpdateMap.clear();
  for (let i = 0; i < waitRooms.length; i++) {
    delete waitRooms[i];
  }
  res.redirect("/api/room/map");
});

// ルームに参加する/作成する
app.post("/api/room", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
  if (!token || token.length < 10 || token.length > 200) {
    res.status(400).json({ msg: "invalid token", reqh: req.headers });
    return;
  }
  // すでにルームに参加済みなら弾く
  if (userRoomMap.has(token)) {
    res.status(400).json({ msg: "already join room, please leave room." });
    return;
  }
  let rid: string = "";
  if (waitRooms.length > 0) {
    const [roomId, err, emsg] = joinRoom(token);
    if (err) {
      console.log("error", emsg);
      res.json({ msg: emsg });
      return;
    }
    rid = roomId;
  } else {
    // 待機部屋0なら作る
    rid = createRoom(token, "/chat");
  }
  roomLastUpdateMap.set(rid, Date.now());
  res.json({ roomId: rid });
  return;
});

app.head("/api/room", (req, res) => {
  const token = req.headers["x-token"] as string;
  const roomId = userRoomMap.get(token);
  if (roomId) {
    const lastUpdate = roomLastUpdateMap.get(roomId);
    if (lastUpdate) {
      res.set("X-Last-Update", `${lastUpdate}`);
      res.status(200).end(); // ボディなしで200 OKを返す
      return;
    }
  }
  res.status(400).end(); // ボディなしで200 OKを返す
});

// 作成したユーザーと相手のユーザー
//  ルームのログを取得する
app.get("/api/room/messages", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
  const room = getRoomInfo(token);
  if (!room) {
    res.status(400).json({ msg: "can not found your room." });
    return;
  }
  const chatPath = room.chatPath;
  if (chatPath) {
    const textj = fs.readFileSync(chatPath, "utf-8");
    const data = JSON.parse(textj);
    res.json(data);
  } else {
    res.status(400).json({ msg: "invalid room obj" });
  }
});

// ルームにChatを登録する
app.post("/api/room/chat", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
  const room = getRoomInfo(token);
  if (!room) {
    res.status(400).json({ msg: "can not found your room." });
    return;
  }
  const { msg } = req.body;
  const chatPath = `/chat/${room.id}`;

  const textj = fs.readFileSync(chatPath, "utf-8");
  let data = JSON.parse(textj);
  const d = new Date();
  data = [
    ...data,
    {
      action: "chat",
      user: token,
      message: msg,
      createdAt: d,
    },
  ];
  fs.writeFileSync(room.chatPath, JSON.stringify(data));
  roomLastUpdateMap.set(room.id, Date.now());
  res.json(data);
});

app.post("/api/room/leave", (req: Request, res: Response) => {
  let debugMsg = "";
  const token = req.headers["x-token"] as string;
  const room = getRoomInfo(token);
  if (!room) {
    res.status(400).json({ msg: "can not found room you are in." });
    return;
  }
  if (userRoomMap.has(token)) {
    userRoomMap.delete(token);
    debugMsg += ", delete user room map.";
  }
  if (roomMap.has(room.id)) {
    for (const user of room.users) {
      if (user && userRoomMap.has(user)) {
        userRoomMap.delete(user);
      }
    }
    roomMap.delete(room.id);
    debugMsg += ", delete room map.";
  }
  const index = waitRooms.findIndex((id) => id === room.id);
  if (index >= 0) {
    delete waitRooms[index];
    debugMsg += ", delete wait room.";
  }
  res.json({ msg: "leave room.", debug: debugMsg, waitRooms, index });
});

module.exports = app;
