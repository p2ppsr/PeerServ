
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
    messageBoxes: 'An array of the messageBoxes you would like to get messages from. If none are provided, all messageBoxes will be included.',
    acknowledged: false
  },
  exampleResponse: {
    status: 'success',
    messages: [{
      sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
      messageBoxId: '42',
      body: '{}'
    }]
  },
  errors: [
    'ERR_MESSAGEBOX_NOT_FOUND'
  ],
  func: async (req, res) => {
    try {
      // Validate Request Body
      if (req.body.messageBoxes) {
        // MessageBoxes must be an array of strings
        if (!Array.isArray(req.body.messageBoxes) || req.body.messageBoxes.some(x => typeof x !== 'string')) {
          return res.status(400).json({
            status: 'error',
            code: 'ERR_INVALID_MESSAGEBOX',
            description: 'MessageBoxes must be an array of strings!'
          })
        }
      }
      // Get all my available unread messages
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey,
        acknowledged: false
      }).select('messageId', 'messageBoxId', 'body', 'sender', 'created_at', 'updated_at')

      // Return all unacknowledged messages if no specific messageBoxes are provided
      if (!req.body.messageBoxes || req.body.messageBoxes.length === 0) {
        return res.status(200).json({
          status: 'success',
          messages
        })
      }

      let messageBoxes = []
      // Get message box ids that belong to me and are in my list of types.
      messageBoxes = await knex('messageBox').where({
        identityKey: req.authrite.identityKey
      }).whereIn('type', req.body.messageBoxes).select('messageBoxId')

      // Only return messages from the requested messageBoxes
      messages = messages.filter(m => {
        let includeMessage = false
        if (req.body.messageBoxes && req.body.messageBoxes.length !== 0) {
          includeMessage = messageBoxes.some(x => x.messageBoxId === m.messageBoxId)
        }
        return includeMessage
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
