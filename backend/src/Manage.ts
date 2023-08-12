import fs from "fs";
import crypto from "crypto";
import { Token, RoomId, IRoom, RoomLog, IUserChatAction } from "./types";

export default class Manage {
  // TODO ここらへんの入れ替え処理は別プロセスにしたほうがいいかもredisとかで
  //
  // チャット部屋変数
  #roomMap: Map<RoomId, IRoom>;
  // ユーザー部屋参加変数
  #userRoomMap: Map<Token, RoomId>;
  // 参加待部屋変数
  #waitRooms: RoomId[];
  // 部屋の最新更新日
  #roomLastUpdateMap: Map<RoomId, number>;
  // 通信中のユーザーリスト
  #roomLockMap: Map<Token, number>;

  constructor() {
    this.#roomMap = new Map();
    this.#userRoomMap = new Map();
    this.#waitRooms = [];
    this.#roomLastUpdateMap = new Map();
    this.#roomLockMap = new Map();
  }

  // tokenと対応する部屋をロックする。
  // 書き込み系の処理の際には基本実行する。
  #lockRoom(roomId: RoomId): boolean {
    const room = this.#roomMap.get(roomId);
    if (room) {
      if (this.#roomLockMap.has(room.id)) return false;
      this.#roomLockMap.set(room.id, 1);
      return true;
    }
    return false;
  }
  #unlockRoom(roomId: RoomId): boolean {
    const room = this.#roomMap.get(roomId);
    if (room) {
      if (this.#roomLockMap.has(room.id)) {
        this.#roomLockMap.delete(room.id);
        return true;
      }
      return false;
    }
    return false;
  }

  // 1. ルームファイルを作成
  // 2. #roomMapにユーザーを登録
  // 3. #userRoomMapにユーザーを登録
  // 4. #waitRoomsにユーザーを追加
  createRoom(token: string, dirPath: string): RoomId | null {
    const id = crypto.randomUUID();
    const chatPath = `${dirPath}/${id}`;
    if (fs.existsSync(chatPath)) {
      return this.createRoom(token, chatPath);
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
    this.#roomMap.set(id, { id, users: [token, undefined], chatPath });
    this.#userRoomMap.set(token, id);
    this.#waitRooms.push(id);
    return id;
  }

  // そこそこ長いので関数化
  // Goみたいな書き方してる
  // ここではTSの言葉で話せ
  joinRoom(token: string): RoomId | null {
    // 待機部屋あるなら参加
    const roomId = this.#waitRooms.pop();
    if (!roomId) {
      return null;
    }
    const room = this.#roomMap.get(roomId);
    if (!room) {
      return null;
    }
    const lock = this.#lockRoom(room.id);
    if (!lock) {
      console.log("error", "failed lock.");
      return null;
    }
    const [a] = room.users;
    room.users = [a, token];
    this.#roomMap.set(roomId, room);
    this.#userRoomMap.set(token, roomId);
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
    const unlock = this.#unlockRoom(room.id);
    if (!unlock) {
      console.log("error", "failed unlock.");
      return null;
    }
    return roomId;
  }

  getRoomInfoWhereUserAreJoin(token: Token): IRoom | null {
    const id = this.#userRoomMap.get(token);
    if (!id) {
      // res.status(400).json({ msg: "not found room: " + id });
      return null;
    }
    const room = this.#roomMap.get(id);
    if (!room) {
      // res.status(400).json({ msg: "not found room: " + id });
      return null;
    }
    return room;
  }

  genRoomMapTableHTML() {
    const keys = Array.from(this.#roomMap.keys());
    let roomListS = "";
    for (const k of keys) {
      const room = this.#roomMap.get(k);
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
    <h2>#roomMap</h2>
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
  genWaitRoomHTML() {
    const rooms = this.#waitRooms.map((r) => `<li>${r}</li>`).join("");
    return `
  <h2>Wait Rooms</h2>
   <ul>
   ${rooms}
   </ul>
  `;
  }
  genuserRoomMapTableHTML() {
    let userRoomPairS = "";
    let keys = Array.from(this.#userRoomMap.keys());
    for (const k of keys) {
      const rid = this.#userRoomMap.get(k);
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

  genLastUpdateRoomHTML() {
    let roomLastUpdatePairS = "";
    let keys = Array.from(this.#roomLastUpdateMap.keys());
    for (const k of keys) {
      const dtn = this.#roomLastUpdateMap.get(k);
      if (dtn) {
        const dtf = new Date(dtn);
        roomLastUpdatePairS += `
        <tr>
          <td>${k}</td>
          <td>${dtf.toLocaleString("ja-JP")}</td>
        </tr>
      `;
      }
    }
    return `
    <h2>#roomLastUpdateMap</h2>
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
  roomAllMap() {
    return `
           <head>
           <link rel="stylesheet" type="text/css" href="/table.css" />
           </head>
           <body>
           <a href="/mng/reset">reset</a>
           <hr />
           ${this.genRoomMapTableHTML()}
           <hr />
           ${this.genuserRoomMapTableHTML()}
           <hr />
           ${this.genLastUpdateRoomHTML()}
           <hr />
           ${this.genWaitRoomHTML()}
           <hr />
           </body>
           `;
  }
  reset() {
    this.#roomMap.clear();
    this.#userRoomMap.clear();
    this.#roomLastUpdateMap.clear();
    for (let i = 0; i < this.#waitRooms.length; i++) {
      delete this.#waitRooms[i];
    }
  }
  isUserJoined(token: Token) {
    return this.#userRoomMap.has(token);
  }
  createOrJoinRoom(token: Token): RoomId | null {
    let rid: string = "";
    if (this.#waitRooms.length > 0) {
      const roomId = this.joinRoom(token);
      if (!roomId) {
        console.log("error", "failed join room");
        return rid;
      }
      rid = roomId;
    } else {
      // 待機部屋0なら作る
      const _rid = this.createRoom(token, "/chat");
      if (_rid) {
        rid = _rid;
      } else {
        console.log("error", "failed join room");
        return null;
      }
    }
    this.#roomLastUpdateMap.set(rid, Date.now());
    return rid;
  }
  // tokenに基づくルームの最終更新時間(unix値)を返却する。
  // 存在しなければnullを返す
  checkUpdate(token: Token): number | null {
    const roomId = this.#userRoomMap.get(token);
    if (!roomId) return null;
    const lUpd = this.#roomLastUpdateMap.get(roomId);
    if (roomId && lUpd) {
      return lUpd;
    }
    return null;
  }
  chat(token: Token, msg: string): IUserChatAction | boolean {
    const room = this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      return false;
    }
    const lock = this.#lockRoom(room.id);
    if (!lock) {
      console.log("error", "failed lock.");
      return false;
    }
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
    this.#roomLastUpdateMap.set(room.id, Date.now());
    const unlock = this.#unlockRoom(room.id);
    if (!unlock) {
      console.log("error", "failed unlock.");
      return false;
    }
    return data;
  }
  leave(token: Token): boolean {
    const room = this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      console.log("error", "cannot find room.");
      return false;
    }
    const lock = this.#lockRoom(room.id);
    if (!lock) {
      console.log("error", "failed lock.");
      return false;
    }
    if (this.#userRoomMap.has(token)) {
      this.#userRoomMap.delete(token);
    }
    if (this.#roomMap.has(room.id)) {
      for (const user of room.users) {
        if (user && this.#userRoomMap.has(user)) {
          this.#userRoomMap.delete(user);
        }
      }
      this.#roomMap.delete(room.id);
    }
    const index = this.#waitRooms.findIndex((id) => id === room.id);
    if (index >= 0) {
      delete this.#waitRooms[index];
    }
    const unlock = this.#unlockRoom(room.id);
    if (!unlock) {
      console.log("error", "failed unlock.");
      return false;
    }
    return true;
  }
  messages(token: Token): RoomLog | null {
    const room = this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      console.log("error", `can not found room[token: ${token}].`);
      return null;
    }
    const chatPath = room.chatPath;
    if (chatPath) {
      const textj = fs.readFileSync(chatPath, "utf-8");
      const data = JSON.parse(textj);
      return data;
    } else {
      console.log("error", `not found room path[path: ${chatPath}].`);
      return null;
    }
  }
}
