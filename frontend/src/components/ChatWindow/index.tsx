import React, { useEffect, useState, useRef } from "react";
import ChatBubble from "../ChatBubble";
import styles from "./index.module.css";
import { Message } from "@/types";

interface IProps {
  messages: Message[];
  sendMessage: (msg: string) => Promise<void>;
}

const ChatWindow: React.FC<IProps> = ({ messages, sendMssage }) => {
  const [inputMessage, setInputMessage] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (inputMessage.trim() !== "") {
      sendMessage(inputMessage.trim());
      setInputMessage("");
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };
  useEffect(() => {
    if (ref && ref.current) {
      const scroll = ref.current.scrollHeight;

      ref.current.scrollTop = scroll;
    }
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.messageContainer} ref={ref}>
        {messages.map((msg, index) => (
          <ChatBubble key={index} message={msg} />
        ))}
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
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
