# matrix-smile-bot

[![#smilebot:t2bot.io](https://img.shields.io/badge/matrix-%23smilebot:t2bot.io-brightgreen.svg)](https://matrix.to/#/#smilebot:t2bot.io)
[![TravisCI badge](https://travis-ci.org/turt2live/matrix-smile-bot.svg?branch=master)](https://travis-ci.org/turt2live/matrix-smile-bot)

A matrix bot that says ":)" when someone says ":("

# Usage

1. Invite `@smile:t2bot.io` to your room
2. Send the message `:(`

# Building your own

*Note*: You'll need to have access to an account that the bot can use to get the access token.

1. Clone this repository
2. `npm install`
3. `npm run build`
4. Copy `config/default.yaml` to `config/production.yaml`
5. Run the bot with `NODE_ENV=production node index.js`
