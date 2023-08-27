import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import useChatRoom from "./hooks/useChatRoom";
import { v4 as uuidv4 } from "uuid";
import styles from "./App.module.css";

function App() {
  const [token, setToken] = useState<string | null>(null);
  const handleChatStartSubmit = async () => {
    let tk = uuidv4();
    if (token) {
      tk = token;
    } else {
      localStorage.setItem("x-token", tk);
    }
    setToken(tk);
  };
  useEffect(() => {
    const tk = localStorage.getItem("x-token");
    if (tk) {
      setToken(tk);
    }
  }, []);
  const { messages, sendMessage, leaveRoom, requestTopic } = useChatRoom(token);
  if (!token) {
    // 部屋参加を促すViewを返却
    return (
      <div className={styles.landingContainer}>
        <h1>shabedabe</h1>
        <p>
          誰でも参加できる、完全匿名のチャットルームです。思いのままに自由に会話しましょう。
        </p>
        <button
          className={styles.joinButton}
          type="button"
          onClick={handleChatStartSubmit}
        >
          チャットを開始する
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <ChatWindow
        leave={async () => {
          localStorage.removeItem("x-token");
          setToken(null);
          leaveRoom();
        }}
        logs={messages}
        sendChat={sendMessage}
        requestTopic={requestTopic}
      />
    </div>
  );
}

export default App;
