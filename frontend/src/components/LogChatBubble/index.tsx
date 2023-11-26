import React from "react";
import styles from "./index.module.css";
import { IUserLog } from "@/types";

type ChatBubbleProps = {
  chat: IUserLog;
};

const actionDescMap: Map<string, string> = new Map();
actionDescMap.set("join", "ユーザーがルームに参加しました");
actionDescMap.set("create", "ルームが作成されました");
actionDescMap.set("leave", "ユーザーがルームから退出しました");
actionDescMap.set("info", "ルーム情報");

const LogChatBubble: React.FC<ChatBubbleProps> = (props) => {
  const { action, isMine, createdAt } = props.chat;
  const actionDesc = actionDescMap.get(action);
  return (
    <div className={isMine ? styles.myLine : styles.otherLine}>
      <div
        className={`${styles.bubble} ${
          isMine ? styles.myBubble : styles.otherBubble
        }`}
      >
        <small>[{isMine ? "あなた" : "相手"}]</small>
        <br />
        {actionDesc && actionDesc}
        <div className={styles.time}>
          <small>{createdAt.toLocaleTimeString()}</small>
        </div>
      </div>
    </div>
  );
};

export default LogChatBubble;
