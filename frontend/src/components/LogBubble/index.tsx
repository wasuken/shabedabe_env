import React from "react";
import styles from "./index.module.css";
import { IChat, ILog } from "@/types";

const actionDescMap: Map<string, string> = new Map();

actionDescMap.set("join", "ユーザーがルームに参加しました");
actionDescMap.set("create", "ルームが作成されました");
actionDescMap.set("leave", "ユーザーがルームから退出しました");
actionDescMap.set("info", "ルーム情報");

type LogBubbleProps = {
  log: ILog;
};

const LogBubble: React.FC<LogBubbleProps> = (props) => {
  const { action, isMine, createdAt } = props.log;
  const actionDesc = actionDescMap.get(action);
  if (!actionDesc) return <div>not found action.</div>;
  return (
    <div className={isMine ? styles.myLine : styles.otherLine}>
      <div>
        <div
          className={`${styles.bubble} ${
            isMine ? styles.myBubble : styles.otherBubble
          }`}
        >
          {actionDesc}
          <div className={styles.time}>
            <small>{createdAt.toLocaleTimeString()}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogBubble;
