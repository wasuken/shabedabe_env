import React from "react";
import styles from "./index.module.css";
import { Message } from "@/types";

type ChatBubbleProps = {
  message: Message;
};

const ChatBubble: React.FC<ChatBubbleProps> = (props) => {
  const { isMine, message, createdAt } = props.message;
  return (
    <div
      className={`${styles.line} ${
        isMine ? styles.myBubble : styles.otherBubble
      }`}
    >
      <div className={`${styles.bubble}`}>{message}</div>
      <div className={styles.time}>
        <small>{createdAt.toLocaleTimeString()}</small>
      </div>
    </div>
  );
};

export default ChatBubble;
