'use strict';

require("dotenv").config();

const { App } = require('@slack/bolt');
const { conversationContext } = require("@slack/bolt/dist/conversation-store");
const { OpenAI } = require("openai");
const genre = ['ファイルディレクトリ操作', 'シェルスクリプト', 'オープンソースライセンス'];

const scripts = [{
    role: 'system',
    content: `linux初心者がコンソール操作をできるかどうかを確認する試験の選択問題を考えています。質問と選択肢 (正解1、不正解3) と解説の案を書いてください。
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
    content: 'LPI-Japanのlinux試験であるLinuC Level1の出題範囲の中から「' + genre[Math.floor(Math.random()*genre.length)] + '」を取りあげてください。'
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
  await app.start(process.env.PORT || 3000);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: scripts,
  });
  const res = completion.choices[0].message.content;
  await app.client.chat.postMessage({
    channel: process.env.SLACK_CHANNEL,
    text: res,
  });
})();