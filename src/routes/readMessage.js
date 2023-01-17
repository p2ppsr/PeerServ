// TODO: Move functionality into listMessage to support listing specific messages
const {
  NODE_ENV
} = process.env
const knex =
      NODE_ENV === 'production' || NODE_ENV === 'staging'
        ? require('knex')(require('../../knexfile.js').production)
        : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/readMessage',
  knex,
  summary: 'Use this route to read one or more messages by ID',
  parameters: {
    messageIds: [123]
  },
  exampleResponse: {
    status: 'success',
    messages: [{
      sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
      messageBoxId: 42,
      body: '{}'
    }]
  },
  func: async (req, res) => {
    try {
      // Validate request body
      if (!req.body.messageIds) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGE_ID_REQUIRED',
          description: 'Please provide the ID of the message(s) to read!'
        })
      }
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
        // Test with just one mismatch...?
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
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_ERROR',
        description: 'An internal error has occurred while reading message(s).'
      })
    }
  }
}
