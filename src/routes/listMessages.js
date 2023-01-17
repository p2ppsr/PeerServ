
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
  summary: 'Use this route to list messages from one or more of your message boxes. Only one filter type should be specified (messageBox or messageId). If no filter type is provided, all messages belonging to the user will be returned.',
  parameters: {
    messageBoxes: '(optional) An array of the messageBoxes you would like to get messages from. If none are provided, all messageBoxes will be included.',
    messageIds: '(optional) An array of specific messages to list'
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
      // Validate Request Body (only one type of list filter should be present)
      if (req.body.messageIds && !req.body.messageBoxes) {
        if (!Array.isArray(req.body.messageIds) || req.body.messageIds.some(x => typeof x !== 'number')) {
          return res.status(400).json({
            status: 'error',
            code: 'ERR_INVALID_MESSAGE_ID',
            description: 'Message IDs must be formatted as an Array of Numbers!'
          })
        }

        // Get requested message(s)
        const messages = await knex('messages').where({
          recipient: req.authrite.identityKey
        }).whereIn('messageId', req.body.messageIds)
          .select('messageId', 'messageBoxId', 'body', 'sender', 'created_at', 'updated_at')
        // TODO: Test with just one mismatch...?
        if (!messages) {
          return res.status(400).json({
            status: 'error',
            code: 'ERR_MESSAGE_NOT_FOUND',
            description: 'One or more messages could not be found!'
          })
        }

        // Return all matching messages
        return res.status(200).json({
          status: 'success',
          messages
        })
      }

      // Else, search for matching messageBoxes
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

      // Currently, only messageBoxes or messageIds are supported. Not both
      if (req.body.messageIds) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_REQUEST',
          description: 'You must choose to filter by messageBoxes or messageIds, not both!'
        })
      }

      // Get all my available unread messages
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey
      }).select('messageId', 'messageBoxId', 'body', 'sender', 'created_at', 'updated_at')

      // Return all messages if no specific messageBoxes are provided
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
