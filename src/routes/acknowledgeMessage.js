
const {
  NODE_ENV
} = process.env
const knex =
        NODE_ENV === 'production' || NODE_ENV === 'staging'
          ? require('knex')(require('../../knexfile.js').production)
          : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/acknowledgeMessage',
  knex,
  summary: 'Use this route to acknowledge a message has been received',
  parameters: {
    messageBoxId: 42,
    messageId: 3301
  },
  exampleResponse: {
    status: 'success'
  },
  errors: [],
  func: async (req, res) => {
    try {
      // Validate request body
      if (!req.body.messageBoxId) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGEBOX_ID_REQUIRED',
          description: 'Please provide a message box id to read from!'
        })
      }
      if (typeof req.body.messageBoxId !== 'number') {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_MESSAGEBOX_ID',
          description: 'MessageBox ID must be formatted as a Number!'
        })
      }
      if (!req.body.messageId) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGE_ID_REQUIRED',
          description: 'Please provide the ID of the message to read!'
        })
      }
      if (typeof req.body.messageId !== 'number') {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_MESSAGE_ID',
          description: 'Message ID must be formatted as a Number!'
        })
      }

      // The server removes the message after it has been acknowledged
      const deleted = await knex('messages').where({
        recipient: req.authrite.identityKey,
        messageBoxId: req.body.messageBoxId,
        messageId: req.body.messageId,
        acknowledged: true
      }).del()

      if (!deleted) {
        // Would this ever happen?
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_ACKNOWLEDGMENT',
          description: 'Message has already been acknowledged!'
        })
      }
      return res.status(200).json({
        status: 'success'
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_ERROR',
        description: 'An internal error has occurred while acknowledging the message'
      })
    }
  }
}
