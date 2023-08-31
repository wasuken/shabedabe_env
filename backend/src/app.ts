import express from 'express';
const app = express();
import { Request, Response } from 'express';
import * as bodyParser from 'body-parser';
import { Server } from 'socket.io';
import Manage from './Manage';
import { convActionLToU } from './types';
import makeLogger, { LogStage } from './Logger';
import { config } from 'dotenv';

config();
const logDirName = process.env.LOG_DIRNAME ?? '/var/log/app';
const logFileName = process.env.LOG_FILENAME ?? 'backend';
const stage = (process.env.LOG_STAGE as LogStage) ?? 'development';
// 迷ったらここに書き込む
const baseLogger = makeLogger(logDirName, logFileName, stage);
const errorLogger = makeLogger(logDirName, 'error', stage);
const chatLogger = makeLogger(logDirName, 'chat', stage);
const reqLogger = makeLogger(logDirName, 'req', stage);

const io = new Server({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
io.on('connect_error', (err) => {
  errorLogger.error(`Socket Error: ${err}`);
});
const chatRoomNamespace = io.of('/room');

chatRoomNamespace.on('connect_error', (err) => {
  errorLogger.error(`chat room connection Error: ${err}`);
});

chatRoomNamespace.on('connection', (socket) => {
  const { handshake } = socket;
  const userData = {
    useragent: handshake.headers['user-agent'],
    ip: handshake.address,
    // その他の情報
  };
  reqLogger.info(`new connection: ${JSON.stringify(userData)}`);
  socket.on('disconnnect', () => {
    reqLogger.info(`user disconnected: ${JSON.stringify(userData)}`);
  });

  socket.on('joinRoom', async (token: string) => {
    const room = await mng.createOrJoinRoom(token);
    baseLogger.info('joinRoom');
    chatLogger.info(JSON.stringify(room));
    if (room) {
      socket.join(room.id);
      for (const action of room.roomLog) {
        socket.emit('message', convActionLToU(action));
      }
      if (room.users[1]) {
        socket.to(room.id).emit('message', convActionLToU(room.roomLog.reverse()[0]));
      }
    }
  });

  // ルームからの退出要求を受け取る
  socket.on('leaveRoom', async (token: string) => {
    const room = await mng.getRoomInfoWhereUserAreJoin(token);
    baseLogger.info('leaveRoom');
    chatLogger.info(JSON.stringify(room));
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
    const room = await mng.getRoomInfoWhereUserAreJoin(token);
    baseLogger.info('message');
    chatLogger.info(JSON.stringify(room));
    if (room) {
      const action = await mng.chat(token, message);
      if (action) {
        chatRoomNamespace.in(room.id).emit('message', convActionLToU(action));
      }
    }
  });
  socket.on('topic', async (token: string) => {
    const room = await mng.getRoomInfoWhereUserAreJoin(token);
    baseLogger.info('topic');
    chatLogger.info(JSON.stringify(room));
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

const mng = new Manage(baseLogger);

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
