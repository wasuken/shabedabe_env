import React, { useEffect, useState, useRef } from "react";
import LogBubble from "../LogBubble";
import LogChatBubble from "../LogChatBubble";
import styles from "./index.module.css";
import { ILog, IChat } from "@/types";

interface IProps {
  token: string;
  logs: (ILog | IChat)[];
  sendChat: (msg: IChat) => Promise<void>;
  leave: () => Promise<Response>;
}

function viewLog(log: IChat | ILog, index: number) {
  if (log.action === "chat") {
    const ch = log as IChat;
    return <LogChatBubble chat={ch} key={index} />;
  } else {
    return <LogBubble log={log} key={index} />;
  }
}

const ChatWindow: React.FC<IProps> = ({ logs, sendChat, token, leave }) => {
  const [inputChat, setInputChat] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputChat.trim() !== "") {
      const chat: IChat = {
        message: inputChat.trim(),
        isMine: true,
        token: token,
        createdAt: new Date(),
        action: "chat",
      };
      sendChat(chat);
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
  useEffect(() => {
    initScroll();
  }, [logs.length]);

  return (
    <div className={styles.container}>
      <div className={styles.messageContainer} ref={ref}>
        {logs.map((msg, index) => viewLog(msg, index))}
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
        <button onClick={handleLeave} className={styles.sendButton}>
          退室
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;