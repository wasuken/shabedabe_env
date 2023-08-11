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

import Manage from "./Manage";

const mng = new Manage();

app.get("/mng/room/map", (req: Request, res: Response) => {
  res.send(mng.roomAllMap());
});
app.get("/mng/reset", (_req: Request, res: Response) => {
  mng.reset();
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
  if (mng.isUserJoined(token)) {
    res.status(400).json({ msg: "already join room, please leave room." });
    return;
  }
  const rid = mng.createOrJoinRoom(token);
  res.json({ roomId: rid });
  return;
});

// tokenに基づくルームの最終更新時間(unix値)を返却する。
// 返却値はheaderのX-Last-Updateに格納する。
app.head("/api/room", (req, res) => {
  const token = req.headers["x-token"] as string;
  const lastUpdate = mng.checkUpdate(token);
  if (lastUpdate) {
    res.set("X-Last-Update", `${lastUpdate}`);
    res.status(200).end(); // ボディなしで200 OKを返す
  } else {
    res.status(400).end(); // ボディなしで200 OKを返す
  }
  return;
});

// 作成したユーザーと相手のユーザー
//  ルームのログを取得する
app.get("/api/room/messages", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
  const data = mng.messages(token);
  if (data) {
    res.json(data);
  } else {
    res.status(400).json({ msg: "invalid room obj" });
  }
});

app.get("/api/room/topics", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
});

// ルームにChatを登録する
app.post("/api/room/chat", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
  const { msg } = req.body;
  const data = mng.chat(token, msg);
  if (data) {
    res.json(data);
  } else {
    res.status(400).json({ msg: "failed chat." });
  }
});

app.post("/api/room/leave", (req: Request, res: Response) => {
  const token = req.headers["x-token"] as string;
  const r = mng.leave(token);
  if (r) {
    res.json({ msg: "leave room." });
  } else {
    res.status(400).json({ msg: "can not found room you are in." });
  }
});

module.exports = app;
