'use strict';

require("dotenv").config();

const { App } = require('@slack/bolt');
const { OpenAI } = require("openai");
const examNames = {
  linuc1: 'LinuC Level1',
  ossdb: 'OSS-DB Silver'
}
const topicSet = process.argv[2] ?? "linuc1";
const scripts = [{
    role: 'system',
    content: `試験の選択問題を考えています。質問と選択肢 (正解1、不正解3) と解説の案を書いてください。
              テンプレートは以下のとおりです。
                ## 質問
                xxxx

                ## 選択肢
                A. aaa
                B. bbb
                C. ccc
                D. ddd

                ## 正解と解説
                正解はXです。xxxx`
  }, {
    role: 'user',
    content: 'LPI-Japanの試験である' + examNames[topicSet] + 'の出題範囲の中から取りあげてください。'
  }

]

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
//アプリが起動時に呼ばれるメソッド
(async () => {
  const oneMonthAgo = Math.floor(new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime() / 1000);
  const channelId = process.env.SLACK_CHANNEL;

  // チャンネル内のメッセージを取得
  const result = await app.client.conversations.history({
      channel: channelId,
      oldest: oneMonthAgo
  });
  const threads = result.messages.filter(msg => msg.thread_ts && msg.bot_id);

  for (const thread of threads) {
    const threadMessages = await app.client.conversations.replies({
      channel: channelId,
      ts: thread.thread_ts
    });

    const latestMessage = threadMessages.messages[threadMessages.messages.length - 1];

    if (!latestMessage.bot_id) {
      // 最新のメッセージがユーザーからのものである場合
      const chatHistory = threadMessages.messages.map(msg => {
        const role = msg.bot_id ? 'assistant' : 'user';
        const content = msg.text;
        return { role, content };
      });

      // OpenAI APIを使用してチャットの内容を処理
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: scripts.concat(chatHistory),
      });

      const res = completion.choices[0].message.content;
      await app.client.chat.postMessage({
        text: res,
        thread_ts: thread.thread_ts,
        channel: channelId
      });
    }
  }
  process.exit();
})();