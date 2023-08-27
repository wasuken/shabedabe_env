import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { IUserLog, IServerLog } from "@/types";
import { generateSHA256Hash } from "@/util";

const useChatRoom = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<IUserLog[]>([]);

  useEffect(() => {
    if (!token) return;
    const newSocket = io(import.meta.env.VITE_CHAT_WS_URL);
    setSocket(newSocket);

    newSocket.emit("joinRoom", token);

    newSocket.on("message", (message: IServerLog) => {
      console.log(message);
      const hashv = generateSHA256Hash(token);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          ...message,
          isMine: message.userHashToken === hashv,
          createdAt: new Date(message.createdAt),
        },
      ]);
    });

    return () => {
      console.log("debug", "アンマウント処理");
      newSocket.emit("leaveRoom", token);
      newSocket.close();
    };
  }, [token]);

  const sendMessage = (message: string) => {
    if (socket && message.trim() !== "") {
      console.log("debug", "send");
      socket.emit("message", token, message);
    }
  };
  const leaveRoom = () => {
    if (socket) {
      socket.emit("leaveRoom", token);
      socket.close();
    }
  };
  const requestTopic = () => {
    if (socket) {
      socket.emit("topic", token);
    }
  };

  return { messages, sendMessage, leaveRoom, requestTopic };
};

export default useChatRoom;
