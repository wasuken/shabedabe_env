import { useState, useEffect } from "react";
import ChatWindow from "./components/ChatWindow";
import { IChat, ILog } from "@/types";
import { fetchJoinRoom, fetchMessages, fetchLeave, fetchPostChat } from "@/api";
import { v4 as uuidv4 } from "uuid";
import styles from "./App.module.css";

function App() {
  const [messages, setMessages] = useState<(ILog | IChat)[]>([]);
  const [token, setToken] = useState<string | null>();
  // 更新してほしいときに逆の値に切り替える
  const [sync, setSync] = useState<number>(0);
  const [msgSync, setMsgSync] = useState<number>(0);
  const syncMessages = async (tk: string) => {
    const res = await fetchMessages(tk);
    const msgs = await res.json();
    if (msgs.length) {
      setMessages(
        msgs.map((m) => {
          return {
            action: m.action,
            token: m.user,
            createdAt: new Date(m.createdAt),
            isMine: m.user === token,
            message: m.message,
          };
        })
      );
    }
  };
  const handleChatStartSubmit = async () => {
    let tk = uuidv4();
    if (token) {
      tk = token;
    } else {
      localStorage.setItem("x-token", tk);
    }

    // 部屋に参加する
    const r = await fetchJoinRoom(tk);
    if (r.ok) {
      await syncMessages(tk);
      setToken(tk);
    }
  };
  const handleSendChat = async (msg: IChat) => {
    if (token) {
      fetchPostChat(token, msg.message);
      setMessages([...messages, msg]);
    }
  };
  useEffect(() => {
    if (token) {
      syncMessages(token);
    }
  }, [sync]);

  useEffect(() => {
    const id = setInterval(() => {
      setSync(Date.now);
      if (!token) clearInterval(msgSync);
    }, 10000);
    setMsgSync(id);
    if (localStorage.getItem("x-token")) {
      setToken(localStorage.getItem("x-token"));
    }
  }, []);
  useEffect(() => {
    if (token) syncMessages(token);
  }, [token]);
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
          return fetchLeave(token).then((r) => {
            setToken(null);
            localStorage.removeItem("x-token");
            return r;
          });
        }}
        token={token}
        logs={messages}
        sendChat={handleSendChat}
      />
    </div>
  );
}

export default App;
