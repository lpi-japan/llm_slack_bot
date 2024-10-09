'use strict';

require("dotenv").config();

const { App } = require('@slack/bolt');
const { conversationContext } = require("@slack/bolt/dist/conversation-store");
const { OpenAI } = require("openai");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

//メッセージが投稿された時に呼ばれるメソッド
app.message(async ({ message, say }) => {
  const thread = app.client.conversations.replies({
    channel: message.channel,
    ts: message.thread_ts || message.ts
  });
  
  const chatHistory = (await thread).messages.map(message => {
    const role = message.bot_id ? 'assistant' : 'user';
    const content = message.text;
    return { role, content };
  });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: chatHistory,
  });
     
  const res = completion.choices[0].message.content;
  await say({
    text: res,
    thread_ts: message.thread_ts || message.ts
  });
});
//アプリが起動時に呼ばれるメソッド
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bolt app is running!');
})();