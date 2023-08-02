// チャットルームに入る
export async function fetchJoinRoom(token: string) {
  return fetch(`/api/room`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-TOKEN": token,
    },
  });
}
// チャットを送る
export async function fetchPostChat(token: string, message: string) {
  let msg = message;
  if (message.length > 100) {
    msg = msg.slice(0, 100);
  }
  return fetch(`/api/room/chat`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-TOKEN": token,
    },
    body: JSON.stringify({
      msg,
    }),
  });
}
// チャットルームから離脱する
export async function fetchLeave(token: string) {
  return fetch(`/api/room/leave`, {
    method: "POST",
    headers: {
      "X-TOKEN": token,
    },
  });
}
export async function fetchMessages(token: string) {
  return fetch(`/api/room/messages`, {
    method: "GET",
    headers: {
      "X-TOKEN": token,
    },
  });
}
