# https://github.com/github/hubot-scripts/blob/master/src/scripts/responders.coffee
class Responders
  constructor: (@robot) ->
    @robot.brain.data.responders = {}
    @robot.brain.on 'loaded', (data) =>
      for pattern, responder of data.responders
        delete responder.index
        @add(pattern, responder.callback)

  responders: ->
    @robot.brain.data.responders

  responder: (pattern) ->
    @responders()[pattern]

  remove: (pattern) ->
    responder = @responder(pattern)
    if responder
      if responder.index
        @robot.listeners.splice(responder.index, 1, (->))
      delete @responders()[pattern]
    responder

  add: (pattern, callback) ->
    try
      eval_pattern = eval("/#{pattern}/i")
    catch error
      eval_pattern = null

    try
      eval_callback = eval("_ = function (msg) { #{callback} }")
    catch error
      eval_callback = null

    if eval_pattern instanceof RegExp and eval_callback instanceof Function
      @remove(pattern)
      @robot.respond(eval_pattern, eval_callback)
      @responders()[pattern] = {
        callback: callback,
        index: @robot.listeners.length - 1,
      }
      @responder(pattern)