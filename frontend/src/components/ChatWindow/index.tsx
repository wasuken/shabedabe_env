import React, { useEffect, useState, useRef } from "react";
import LogChatBubble from "../LogChatBubble";
import styles from "./index.module.css";
import { IUserLog } from "@/types";

interface IProps {
  logs: IUserLog[];
  sendChat: (msg: string) => void;
  leave: () => void;
  requestTopic: () => void;
}

const ChatWindow: React.FC<IProps> = ({
  logs,
  sendChat,
  leave,
  requestTopic,
}) => {
  const [inputChat, setInputChat] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputChat.trim() !== "" && inputChat.length <= 100) {
      sendChat(inputChat.trim());
      setInputChat("");
    }
  };
  const handleLeave = () => {
    leave();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };
  const initScroll = () => {
    if (ref && ref.current) {
      const scroll = ref.current.scrollHeight;

      ref.current.scrollTop = scroll;
    }
  };
  const handleTopic = () => {
    requestTopic();
  };
  useEffect(() => {
    initScroll();
  }, [logs.length]);

  return (
    <div className={styles.container}>
      <div className={styles.headerContainer}>
        <button onClick={handleTopic} className={styles.headerButton}>
          話題BOX
        </button>
        <button onClick={handleLeave} className={styles.headerButton}>
          退室
        </button>
      </div>
      <div className={styles.messageContainer} ref={ref}>
        {logs.map((msg, index) => (
          <LogChatBubble chat={msg} key={index} />
        ))}
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={inputChat}
          onChange={(e) => setInputChat(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.inputField}
        />
        <button onClick={handleSend} className={styles.sendButton}>
          送信
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
