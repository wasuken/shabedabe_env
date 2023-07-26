import express from "express";
const app = express();
import { Request, Response } from "express";

app.get("/api/", (req: Request, res: Response) => {
  res.send("ok!");
});

module.exports = app;
