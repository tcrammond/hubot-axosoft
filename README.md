# hubot-axosoft

A [hubot](https://hubot.github.com/) script that helps you quickly grab data from [Axosoft, an awesome agile project management tool](http://www.axosoft.com). 

## Requirements

You will need an existing [hubot](https://hubot.github.com/) installation as well as [node/npm](https://nodejs.org/).

## Installation

In your hubot directory, run:

```bash
npm install hubot-axosoft --save
```

Now add **hubot-axosoft** to your `external-scripts.json`:

```json
["hubot-axosoft"]
```

(You might need to restart your hubot after doing this)

You should now be ready to start using commands wherever you normally interact with hubot.

## Setup
Before doing anything else you'll need to authenticate the app with your Axosoft account.

1. Run `hubot axosoft set url youraxosofturl.axosoft.com`
2. Run `hubot axosoft authenticate` and you'll be given a link to visit on Axosoft.
3. From there you will be prompted to allow the app to access your data and will then be provided with an access token. 
4. You need to add the token with `hubot axosoft set token TOKEN-GOES-HERE`, or failing that, add it to `node_modules/hubot-axosoft/axosoft.config.json` as the `ACCESS_TOKEN` key.
5. Run `hubot axosoft setup` and hubot will do some behind-the-scenes setup, such as store a list of your projects. You can re-run this at any time to get fresh data.

Onto the good stuff!

## All available interactions

### Authenticate
```
hubot axosoft authenticate
```
Returns an Axosoft URL where you can authenticate the app with your account.

### Setup
```
hubot axosoft setup
```
Performs some behind-the-scenes setup, such as store a list of your projects. 

You can re-run this at any time to get fresh data.

### Work logs
```
hubot axosoft work logs from DAY
```

Lists work logs submitted on the given day, grouped by user and item.

Example usage & supported parameters
```
hubot ontime work logs from today
hubot ontime work logs from yesterday
hubot ontime work logs from monday
hubot ontime work logs from 2015-01-13
```

Output:
```
Work logs from 2015-01-13:
Tyler Crammond:
[1234] Make everything awesome - 0.5hr
Velocity: 0.5hr

James Martin:
[55] Clean up Tyler's code - 1.23hr
Velocity: 1.23hr

Total: 1.73hr
```

### Add new bug
```
hubot add bug "TITLE" to PROJECT
```
Adds a new bug to the specified project. Note that your title must be in quotes. 

### Find bug by ID
```
hubot bug ID
```
Returns some information about the bug with the given ID.

### Add new feature
```
hubot add feature "TITLE" to PROJECT
```
Adds a new feature to the specified project. Note that your title must be in quotes. 

### Find feature by ID
```
hubot feature ID
```
Returns some information about the bug with the given ID.




#### Misc.
License: MIT

All trademarks are the property of their respective owners.
