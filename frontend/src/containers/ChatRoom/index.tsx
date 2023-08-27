import ChatWindow from "@/components/ChatWindow";
import useChatRoom from "@/hooks/useChatRoom";
// import styles from "./index.module.css";

interface IProps {
  token: string;
  setToken: (token: string | null) => void;
}

function ChatRoom(props: IProps) {
  const { token, setToken } = props;
  const { messages, sendMessage, leaveRoom, requestTopic } = useChatRoom(token);
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

export default ChatRoom;
