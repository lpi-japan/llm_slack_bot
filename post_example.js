'use strict';

require("dotenv").config();

const { App } = require('@slack/bolt');
const { OpenAI } = require("openai");
const fs = require('fs');

const topicSet = process.argv[2] ?? "linuc1";
const channels = {
  linuc1: process.env.SLACK_CHANNEL,
  ossdb: process.env.SLACK_CHANNEL_OSSDB
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

//アプリが起動時に呼ばれるメソッド
(async () => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: createScript(topicSet),
  });
  const res = completion.choices[0].message.content;
  console.log(res);
  await app.client.chat.postMessage({
    channel: channels[topicSet],
    text: res,
  });
  process.exit();
})();

function createScript(topicSet) {
  const topics = JSON.parse(fs.readFileSync('topics.json', 'utf8')).topics[topicSet];
  const topicNumber = Math.floor(Math.random()*topics.length);
  const content = {
    linuc1:'LPI-Japanのlinux試験であるLinuC Level1の出題範囲の中から「' + topics[topicNumber] + '」を取りあげてください。',
    ossdb:'LPI-Japanのデータベース試験であるOSS-DB Silverの出題範囲の中から「' + topics[topicNumber]["topic"] + '」を取りあげてください。 ここで言う' + topics[topicNumber]["topic"] + 'とは、' + topics[topicNumber]["description"] + 'のことで、出題範囲は' + topics[topicNumber]["range"] + 'です。',
  }
  return [
    {
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
      content: content[topicSet]
    }
  ]
}