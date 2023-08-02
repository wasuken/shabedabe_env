import React from "react";
import styles from "./index.module.css";
import { IChat } from "@/types";

type ChatBubbleProps = {
  chat: IChat;
};

const LogChatBubble: React.FC<ChatBubbleProps> = (props) => {
  const { isMine, message, createdAt } = props.chat;
  return (
    <div className={isMine ? styles.myLine : styles.otherLine}>
      <div>
        <div
          className={`${styles.bubble} ${
            isMine ? styles.myBubble : styles.otherBubble
          }`}
        >
          {message}
          <div className={styles.time}>
            <small>{createdAt.toLocaleTimeString()}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogChatBubble;
