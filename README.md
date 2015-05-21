# hubot-axosoft

![Hubot Logo](http://i.imgur.com/pp7scrv.png)

A [hubot](https://hubot.github.com/) script that helps you quickly grab data from and add new items to [Axosoft, an agile project management tool](http://www.axosoft.com). 

Works both in the command line and hubot chat integrations. Tested with:
* [Slack](http://www.slack.com)

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

You will probably need to restart your hubot after doing this. You should now be ready to start using commands wherever you normally interact with hubot.

## Setup
Before doing anything else you'll need to authenticate the app with your Axosoft account.

1. Run `hubot axosoft set url youraxosofturl.axosoft.com`.
2. Run `hubot axosoft authenticate` and you'll be given a link. Please open this in your browser.
3. You'll now be asked to give hubot-axosoft read and write access to your account, after which you'll get redirected to a page displaying an authentication token (this can take a minute or two).
4. Run `hubot axosoft set token TOKEN-GOES-HERE` to save the token.
5. Finally, run `hubot axosoft setup` and hubot will do some behind-the-scenes setup, such as grabbing a list of your projects and retrieving your item type names. **Tip:** You can re-run this at any time to get fresh data.

Onto the good stuff!

## Available interactions

### Work log report
```
hubot axosoft work logs from DAY
```

Lists work logs submitted on the given day, grouped by user and item. Useful for standups/etc. and generally seeing what your team is up to.

Example usage & supported parameters:
```
hubot axosoft work logs from today
hubot axosoft work logs from yesterday
hubot axosoft work logs from monday
hubot axosoft work logs from 2015-01-13
```

Output:
```
Work logs from 2015-01-13:
Tyler Crammond:
[1234] Make everything awesome - 0.5hr
Total: 0.5hr

James Martin:
[55] Clean up Tyler's code - 1.23hr
Total: 1.23hr

Grand total: 1.73hr
```

### Find feature by ID
```
hubot axosoft feature ID
```
Returns some information about the bug with the given ID. If you use a different name for features you should use that name instead.

Example output:
```
Implement new home page design
Project: Awesome Web App
Description:
Implement Chris' new design for our home page.
URL: https://myurl.axosoft.com/viewitem.aspx?id=99&type=features
```

### Add new feature
```
hubot add feature "TITLE" to PROJECT
```
Adds a new feature to the specified project. If you use a different name for features you should use that name instead.
Note that your title must be in quotes. 

### Find bug by ID
```
hubot axosoft bug ID
```
Returns some information about the bug with the given ID. If you use a different name for bugs you should use that name instead.

### Add new bug
```
hubot add bug "TITLE" to PROJECT
```
Adds a new bug to the specified project. If you use a different name for bugs you should use that name instead.
Note that your title must be in quotes. 

### Find ticket by ID
```
hubot axosoft ticket ID
```
Returns some information about the bug with the given ID. If you use a different name for tickets you should use that name instead.

### Add new ticket
```
hubot add ticket "TITLE" to PROJECT
```
Adds a new ticket to the specified project. If you use a different name for tickets you should use that name instead.
Note that your title must be in quotes. 

#### Misc.
License: MIT

All trademarks are the property of their respective owners.
