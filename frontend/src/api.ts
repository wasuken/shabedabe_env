// チャットルームに入る
export async function fetchJoinRoom(roomId: string, token: string) {
  return fetch(`/api/room/${roomId}/join`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-TOKEN": token,
    },
  });
}
// チャットを送る
export async function fetchPostChat(
  roomId: string,
  token: string,
  message: string
) {
  return fetch(`/api/room/${roomId}/chat`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-TOKEN": token,
    },
    body: JSON.stringify({
      roomId,
      message,
    }),
  });
}
// チャットルームから離脱する
export async function fetchDelete(roomId: string, token: string) {
  return fetch(`/api/room/${roomId}/leave`, {
    method: "delete",
    headers: {
      "X-TOKEN": token,
    },
  });
}
