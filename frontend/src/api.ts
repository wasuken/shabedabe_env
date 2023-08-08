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
// ルームログの最終更新日をheadで取得し、
// 引数lastUpdateよりも大きいUnix値だった場合、
// fetchMessages(Promise)を返却する
export async function fetchMessagesCheckForUpdate(
  token: string,
  lastUpdate: number
) {
  const res = await fetch(`/api/room`, {
    method: "HEAD",
    headers: {
      "X-TOKEN": token,
    },
  });
  if (res.ok) {
    const lUpdate = parseInt(res.headers.get("X-Last-Update") as string);
    if (lUpdate > lastUpdate) {
      return fetchMessages(token);
    }
  } else {
    throw new Error("fetch error.");
  }
}
export async function fetchMessages(token: string) {
  return fetch(`/api/room/messages`, {
    method: "GET",
    headers: {
      "X-TOKEN": token,
    },
  });
}
