import crypto from 'crypto';
import { Action, Token, RoomId, IRoom, RoomLog, topics, ILoggingAction } from './types';
import { config } from 'dotenv';
import { RedisClientType, createClient } from 'redis';
import {
  RedisClientMapWrapper,
  RedisClientSetsMapper,
  RedisClientKVWrapper,
} from './RedisClientWrapper';

config();

export default class Manage {
  // チャット部屋変数
  #roomMap: RedisClientMapWrapper<RoomId, IRoom>;
  // ユーザー部屋参加変数
  #userRoomMap: RedisClientKVWrapper;
  // 参加待部屋変数
  #waitRooms: RedisClientSetsMapper;
  // 部屋の最新更新日
  #roomLastUpdateMap: RedisClientKVWrapper;
  // redis client
  #client: RedisClientType;

  constructor() {
    this.#client = createClient({ url: process.env.REDIS_URL });
    this.#client.on('error', (err) => console.log('Redis Client Error', err));
    this.#client.connect().then(() => console.log('info', 'connected'));

    this.#roomMap = new RedisClientMapWrapper(this.#client, 'roomMap');
    this.#userRoomMap = new RedisClientKVWrapper(this.#client, 'userRoomMap');
    this.#waitRooms = new RedisClientSetsMapper(this.#client, 'waitRooms');
    this.#roomLastUpdateMap = new RedisClientKVWrapper(this.#client, 'roomLastUpdateMap');
  }

  // 1. ルームファイルを作成
  // 2. #roomMapにユーザーを登録
  // 3. #userRoomMapにユーザーを登録
  // 4. #waitRoomsにユーザーを追加
  async createRoom(token: string): Promise<IRoom | null> {
    const id = crypto.randomUUID();
    const d = new Date();
    const roomLog: RoomLog = [
      {
        action: 'create',
        user: token,
        createdAt: d,
        message: '',
      },
      {
        action: 'join',
        user: token,
        createdAt: d,
        message: '',
      },
    ];
    const room: IRoom = { id, users: [token, undefined], roomLog };
    await this.#roomMap.set(id, room);
    await this.#userRoomMap.set(token, id);
    await this.#waitRooms.push(id);
    return room;
  }

  // そこそこ長いので関数化
  // Goみたいな書き方してる
  // ここではTSの言葉で話せ
  async joinRoom(token: string): Promise<IRoom | null> {
    // 待機部屋あるなら参加
    const roomId = await this.#waitRooms.pop();
    if (!roomId) {
      return null;
    }
    const room = await this.#roomMap.get(roomId);
    if (!room) {
      return null;
    }
    const [a] = room.users;
    room.users = [a, token];

    const roomLog: RoomLog = [
      {
        action: 'join',
        user: token,
        createdAt: new Date(),
        message: '',
      },
    ];

    room.roomLog = [...room.roomLog, ...roomLog];

    await this.#roomMap.set(roomId, room);
    await this.#userRoomMap.set(token, roomId);
    return room;
  }

  async getRoomInfoWhereUserAreJoin(token: Token): Promise<IRoom | null> {
    const id = await this.#userRoomMap.get(token);
    if (!id) {
      return null;
    }
    const room = await this.#roomMap.get(id);
    if (!room) {
      return null;
    }
    return room;
  }

  //  genRoomMapTableHTML() {
  //    const keys = Array.from(this.#roomMap.keys());
  //    let roomListS = '';
  //    for (const k of keys) {
  //      const room = this.#roomMap.get(k);
  //      if (room) {
  //        const [a, bb] = room?.users;
  //        const b = bb || 'empty user';
  //        roomListS += `
  //	<tr>
  //	  <td>${room.id}</td>
  //	  <td>${a}</td>
  //	  <td>${b}</td>
  //	  <td>${room.chatPath}</td>
  //	</tr>
  //      `;
  //      }
  //    }
  //    return `
  //    <h2>#roomMap</h2>
  //    <table>
  //     <thead>
  //       <tr>
  //	 <th>room id</th>
  //	 <th>userA</th>
  //	 <th>userB</th>
  //	 <th>chatPath</th>
  //       </tr>
  //     </thead>
  //     <tbody>
  //      ${roomListS}
  //     </tbody>
  //    </table>
  //  `;
  //  }
  //  genWaitRoomHTML() {
  //    const rooms = this.#waitRooms.map((r) => `<li>${r}</li>`).join('');
  //    return `
  //  <h2>Wait Rooms</h2>
  //   <ul>
  //   ${rooms}
  //   </ul>
  //  `;
  //  }
  //  genuserRoomMapTableHTML() {
  //    let userRoomPairS = '';
  //    let keys = Array.from(this.#userRoomMap.keys());
  //    for (const k of keys) {
  //      const rid = this.#userRoomMap.get(k);
  //      if (rid) {
  //        userRoomPairS += `
  //	<tr>
  //	  <td>${k}</td>
  //	  <td>${rid}</td>
  //	</tr>
  //      `;
  //      }
  //    }
  //    return `
  //    <h2>userMap</h2>
  //    <table>
  //     <thead>
  //       <tr>
  //	 <th>user token</th>
  //	 <th>room id</th>
  //       </tr>
  //     </thead>
  //     <tbody>
  //      ${userRoomPairS}
  //     </tbody>
  //    </table>
  //  `;
  //  }
  //
  //  genLastUpdateRoomHTML() {
  //    let roomLastUpdatePairS = '';
  //    let keys = Array.from(this.#roomLastUpdateMap.keys());
  //    for (const k of keys) {
  //      const dtn = this.#roomLastUpdateMap.get(k);
  //      if (dtn) {
  //        const dtf = new Date(dtn);
  //        roomLastUpdatePairS += `
  //	<tr>
  //	  <td>${k}</td>
  //	  <td>${dtf.toLocaleString('ja-JP')}</td>
  //	</tr>
  //      `;
  //      }
  //    }
  //    return `
  //    <h2>#roomLastUpdateMap</h2>
  //    <table>
  //     <thead>
  //       <tr>
  //	 <th>room id</th>
  //	 <th>last update</th>
  //       </tr>
  //     </thead>
  //     <tbody>
  //      ${roomLastUpdatePairS}
  //     </tbody>
  //    </table>
  //  `;
  //  }
  //  roomAllMap() {
  //    return `
  //	   <head>
  //	   <link rel="stylesheet" type="text/css" href="/table.css" />
  //	   </head>
  //	   <body>
  //	   <a href="/mng/reset">reset</a>
  //	   <hr />
  //	   ${this.genRoomMapTableHTML()}
  //	   <hr />
  //	   ${this.genuserRoomMapTableHTML()}
  //	   <hr />
  //	   ${this.genLastUpdateRoomHTML()}
  //	   <hr />
  //	   ${this.genWaitRoomHTML()}
  //	   <hr />
  //	   </body>
  //	   `;
  //  }
  //reset() {
  //  this.#roomMap.clear();
  //  this.#userRoomMap.clear();
  //  this.#roomLastUpdateMap.clear();
  //  for (let i = 0; i < this.#waitRooms.length; i++) {
  //    delete this.#waitRooms[i];
  //  }
  //}
  isUserJoined(token: Token) {
    return this.#userRoomMap.has(token);
  }
  async createOrJoinRoom(token: Token): Promise<IRoom | null> {
    const len = await this.#waitRooms.length();
    if (len > 0) {
      const room = await this.joinRoom(token);
      if (room) {
        this.#roomLastUpdateMap.set(room.id, `${Date.now()}`);
        return room;
      } else {
        console.log('error', 'failed join room');
      }
    } else {
      // 待機部屋0なら作る
      const room = await this.createRoom(token);
      if (room) {
        this.#roomLastUpdateMap.set(room.id, `${Date.now()}`);
        return room;
      } else {
        console.log('error', 'failed create room');
      }
    }
    return null;
  }
  // tokenに基づくルームの最終更新時間(unix値)を返却する。
  // 存在しなければnullを返す
  async checkUpdate(token: Token): Promise<number | null> {
    const roomId = await this.#userRoomMap.get(token);
    if (!roomId) return null;
    const lUpd = await this.#roomLastUpdateMap.get(roomId);
    if (roomId && lUpd) {
      return parseInt(lUpd);
    }
    return null;
  }
  async chat(token: Token, msg: string): Promise<ILoggingAction | null> {
    return this.#chat('chat', token, msg);
  }
  async #chat(action: Action, token: Token, msg: string): Promise<ILoggingAction | null> {
    const room = await this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      return null;
    }
    const m = msg.length > 100 ? msg.slice(0, 100) : msg;
    const actionObj = {
      action: action,
      user: token,
      message: m,
      createdAt: new Date(),
    };

    room.roomLog = [...room.roomLog, actionObj];
    await this.#roomLastUpdateMap.set(room.id, `${Date.now()}`);
    await this.#roomMap.set(room.id, room);
    return actionObj;
  }
  async leave(token: Token): Promise<ILoggingAction | null> {
    const room = await this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      console.log('error', 'cannot find room.');
      return null;
    }
    const has = await this.#userRoomMap.has(token);
    if (has) {
      this.#userRoomMap.delete(token);
    }
    const roomHas = await this.#roomMap.has(room.id);
    if (roomHas) {
      for (const user of room.users) {
        if (user) {
          await this.#userRoomMap.delete(user);
        }
      }
      this.#roomMap.delete(room.id);
    }
    this.#waitRooms.delete(room.id);
    return {
      action: 'leave',
      user: token,
      message: 'leave user',
      createdAt: new Date(),
    };
  }
  async messages(token: Token): Promise<RoomLog | null> {
    const room = await this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      console.log('error', `can not found room[token: ${token}].`);
      return null;
    }
    return room.roomLog;
  }
  // 後に別ファイルに移動するかも
  #shuffleArray<V>(array: V[]): V[] {
    return array.slice().sort(() => Math.random() - Math.random());
  }
  async sendRandomTopic(token: Token): Promise<ILoggingAction | null> {
    const room = await this.getRoomInfoWhereUserAreJoin(token);
    if (!room) {
      console.log('error', `can not found room[token: ${token}].`);
      return null;
    }
    const topic = this.#shuffleArray(topics)[0];
    const msg = `話題BOXごそごそ.... ${topic}!${topic}についてなんでも話してみよう`;
    return this.#chat('info', token, msg);
  }
}
