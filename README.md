# 1-800-Flowers Alexa Skill

An Amazon Alexa skill for ordering flowers via 1-800-Flowers

1. Initial Setup

* Install Node 0.10.36. This is the only supported by AWS Lambda. If you use brew you can install it using:
`brew install https://github.com/Homebrew/homebrew/blob/b64d9b9c431642a7dd8d85c8de5a530f2c79d924/Library/Formula/node.rb`
* To install dependencies run `npm install`
* For local development, copy local.json.example and change `[CHANGE-THIS]` by your own values, you need to get the `redirectUrl` from your skill `Configuration > Redirect URL` and `appId` from `Skill Information > Application Id`. `trackingCode` from Google is optional.
* To compile run `npm run compile`

2. Development

* To run nodejs server and watch for changes run `npm run watch` or `gulp watchi`
* To test run 

3. Directory Structure

`config/` -> Environment variables or configuration
`services/` -> API clients, Authentications and Extras
`skill/` -> Amazon Echo Skill login
`speechAssets/` -> Amazon Echo Utterances, Intent Schema and Custom Slots.
`tests/` -> Unit Tests
`www/` -> Public site, expose for authentication.
`deploy.sh`
`gulpfile.js` -> Gulp tasks
`package.json` -> Dependencies
`README.md`
