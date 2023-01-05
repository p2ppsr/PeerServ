
const {
  NODE_ENV
} = process.env
const knex =
      NODE_ENV === 'production' || NODE_ENV === 'staging'
        ? require('knex')(require('../../knexfile.js').production)
        : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/listMessages',
  knex,
  summary: 'Use this route to check for new messages or list all messages from one or more of your message boxes.',
  parameters: {
    messageBoxTypes: 'An array of the messageBoxTypes you would like to get messages from. If none are provided, all messageBoxes will be included.',
    acknowledged: false
  },
  exampleResponse: {
    status: 'success',
    messages: [{
      sender: 'xyz',
      messageBoxId: 'abc',
      body: ''
    }]
  },
  errors: [
    'ERR_MESSAGEBOX_NOT_FOUND'
  ],
  func: async (req, res) => {
    try {
      // Get all my available messages
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey
      }).select('messageId', 'messageBoxId', 'body', 'sender', 'acknowledged', 'created_at', 'updated_at')

      if (!req.body.messageBoxTypes) {
        // Return all messages
        return res.status(200).json({
          status: 'success',
          messages
        })
      }

      let messageBoxes = []
      // Get message box ids that belong to me and are in my list of types.
      if (req.body.messageBoxTypes && req.body.messageBoxTypes.length !== 0) {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).whereIn('type', req.body.messageBoxTypes).select('type', 'messageBoxId')
      } else {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).select('type', 'messageBoxId')
      }

      // Only return messages from the requested messageBoxes
      messages = messages.filter(m => {
        let validMessage = false
        if (req.body.messageBoxTypes && req.body.messageBoxTypes.length !== 0) {
          validMessage = messageBoxes.some(x => x.messageBoxId === m.messageBoxId)
        }
        if ('acknowledged' in req.body) {
          validMessage = Boolean(m.acknowledged) === req.body.acknowledged
        }
        return validMessage
      })

      return res.status(200).json({
        status: 'success',
        messages
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_ERROR',
        description: 'An internal error has occurred while listing messages.'
      })
    }
  }
}
