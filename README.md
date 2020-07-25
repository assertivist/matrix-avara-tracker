# matrix-avara-tracker

A matrix bot that checks the avara tracker and posts games when they are hosted

you can also do '!tracker' for a list

This was shamelessly hacked out of "matrix-smile-bot" -- this repo should be a fork of that if you're interested -- absolutely do not use this as an example of how to do anything

# Building your own

*Note*: You'll need to have access to an account that the bot can use to get the access token.

1. Clone this repository
2. `npm install`
3. `npm run build`
4. Copy `config/default.yaml` to `config/production.yaml`
5. Run the bot with `NODE_ENV=production node index.js`
