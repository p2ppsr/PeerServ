
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
  summary: 'Use this route to read a message',
  parameters: {
    messageBoxType: 'payment_inbox',
    messageId: 123
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
      // Validate request body
      if (!req.body.messageBoxType) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGEBOX_TYPE_REQUIRED',
          description: 'Please provide a message box type to read from!'
        })
      }
      if (!req.body.messageId) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGEID_REQUIRED',
          description: 'Please provide the ID of the message to read!'
        })
      }

      // Get the messageBox to read from
      const [messageBox] = await knex('messageBox').where({
        identityKey: req.authrite.identityKey,
        type: req.body.messageBoxType
      }).select('messageBoxId')

      if (!messageBox) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGEBOX_TYPE_NOT_FOUND',
          description: 'Requested messageBox type could not be found!'
        })
      }

      // Get requested message
      const [message] = await knex('messages').where({
        recipient: req.authrite.identityKey,
        messageBoxId: messageBox.messageBoxId,
        messageId: req.body.messageId
      }).select('messageId', 'messageBoxId', 'body', 'sender', 'created_at', 'updated_at')

      if (!message) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGE_NOT_FOUND',
          description: 'Requested message could not be found!'
        })
      }

      // Mark this message as acknowledged, and ready for deletion
      await knex('messages').where({
        recipient: req.authrite.identityKey,
        messageBoxId: messageBox.messageBoxId,
        messageId: req.body.messageId
      }).update({
        acknowledged: true
      })

      // Message is returned
      // Note: It is up to the client to send an acknowledgement to the server
      return res.status(200).json({
        status: 'success',
        message
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_ERROR',
        description: 'An internal error has occurred while reading message.'
      })
    }
  }
}
