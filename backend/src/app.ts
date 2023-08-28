import express from 'express';
const app = express();
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import { Server } from 'socket.io';
import Manage from './Manage';
import { convActionLToU } from './types';

const io = new Server({
  cors: {
    origin: '*', // ここは適切に設定する
    methods: ['GET', 'POST'],
  },
});
io.on('connect_error', (err) => {
  console.log('con_err', err);
});
const chatRoomNamespace = io.of('/room');

chatRoomNamespace.on('connect_error', (err) => {
  console.log('/room/con_err', err);
});

chatRoomNamespace.on('connection', (socket) => {
  socket.on('joinRoom', async (token: string) => {
    console.log('ws', 'joinRoom');
    const room = await mng.createOrJoinRoom(token);
    if (room) {
      socket.join(room.id);
      for (const action of room.roomLog) {
        chatRoomNamespace.in(room.id).emit('message', convActionLToU(action));
      }
    }
  });

  // ルームからの退出要求を受け取る
  socket.on('leaveRoom', async (token: string) => {
    console.log('ws', 'leaveRoom');
    const room = await mng.getRoomInfoWhereUserAreJoin(token);
    if (room) {
      const leaveAction = await mng.leave(token);
      if (leaveAction) {
        socket.leave(room.id);
        socket.to(room.id).emit('message', convActionLToU(leaveAction));
      }
    }
  });

  // メッセージを受け取って、同じルームのユーザーに送信する
  socket.on('message', async (token: string, message: string) => {
    console.log('ws', 'message');
    const room = await mng.getRoomInfoWhereUserAreJoin(token);
    if (room) {
      const action = await mng.chat(token, message);
      if (action) {
        chatRoomNamespace.in(room.id).emit('message', convActionLToU(action));
      }
    }
  });
  socket.on('topic', async (token: string) => {
    console.log('ws', 'message');
    const room = await mng.getRoomInfoWhereUserAreJoin(token);
    if (room) {
      const action = await mng.sendRandomTopic(token);
      if (action) {
        chatRoomNamespace.in(room.id).emit('message', convActionLToU(action));
      }
    }
  });
});

io.listen(3001);

app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);
app.use(bodyParser.json());

const mng = new Manage();

// 管理系
// 後ほどファイルを分ける？
//app.get("/mng/room/map", (_req: Request, res: Response) => {
//  res.send(mng.roomAllMap());
//});
//app.get("/mng/reset", (_req: Request, res: Response) => {
//  mng.reset();
//  res.redirect("/mng/room/map");
//});

// API系
// ルームに参加する/作成する
app.post('/api/room', async (req: Request, res: Response) => {
  const token = req.headers['x-token'] as string;
  if (!token || token.length < 10 || token.length > 200) {
    res.status(400).json({ msg: 'invalid token', reqh: req.headers });
    return;
  }
  // すでにルームに参加済みなら弾く
  if (await mng.isUserJoined(token)) {
    res.status(400).json({ msg: 'already join room, please leave room.' });
    return;
  }
  const rid = await mng.createOrJoinRoom(token);
  res.json({ roomId: rid });
  return;
});

app.post('/api/room/topic', async (req: Request, res: Response) => {
  const token = req.headers['x-token'] as string;
  const topic = await mng.sendRandomTopic(token);
  res.json({ topic });
  return;
});

// tokenに基づくルームの最終更新時間(unix値)を返却する。
// 返却値はheaderのX-Last-Updateに格納する。
app.head('/api/room', async (req, res) => {
  const token = req.headers['x-token'] as string;
  const lastUpdate = await mng.checkUpdate(token);
  if (lastUpdate) {
    res.set('X-Last-Update', `${lastUpdate}`);
    res.status(200).end(); // ボディなしで200 OKを返す
  } else {
    res.status(400).end(); // ボディなしで200 OKを返す
  }
  return;
});

// 作成したユーザーと相手のユーザー
//  ルームのログを取得する
app.get('/api/room/messages', async (req: Request, res: Response) => {
  const token = req.headers['x-token'] as string;
  const data = await mng.messages(token);
  if (data) {
    res.json(data);
  } else {
    res.status(400).json({ msg: 'invalid room obj' });
  }
});

// ルームにChatを登録する
app.post('/api/room/chat', async (req: Request, res: Response) => {
  const token = req.headers['x-token'] as string;
  const { msg } = req.body;
  const data = await mng.chat(token, msg);
  if (data) {
    res.json(data);
  } else {
    res.status(400).json({ msg: 'failed chat.' });
  }
});

app.post('/api/room/leave', async (req: Request, res: Response) => {
  const token = req.headers['x-token'] as string;
  const r = await mng.leave(token);
  if (r) {
    res.json({ msg: 'leave room.' });
  } else {
    res.status(400).json({ msg: 'can not found room you are in.' });
  }
});

module.exports = app;
