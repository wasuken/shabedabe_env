import { useState } from "react";
import ChatWindow from "./components/ChatWindow";

function App() {
  const [messages, setMessages] = useState([
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    },
    { message: "こんにちは！", isMine: true, createdAt: new Date() },
    {
      message: "こんにちは、元気ですか？ last",
      isMine: false,
      createdAt: new Date(),
    },
  ]);
  return (
    <div>
      <ChatWindow messages={messages} />
    </div>
  );
}

export default App;
