export function initMessages(pairs: number) {
  const testcase = [];
  for (let i = 0; i < pairs; i++) {
    const my = { message: "こんにちは！", isMine: true, createdAt: new Date() };
    const other = {
      message:
        "こんにちは、元気ですか？こんにちは、元気ですか？こんにちは、元気ですか？こんにちは、元気ですか？こんにちは、元気ですか？",
      isMine: false,
      createdAt: new Date(),
    };
    testcase.push(my);
    testcase.push(other);
  }
  return testcase;
}
