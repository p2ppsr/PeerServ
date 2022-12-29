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
  summary: 'Use this route to list messages from one or more of your message boxes.',
  parameters: {
    messageBoxTypes: 'An array of the messageBoxTypes you would like to list messages from. If none are provided, all messageBoxes will be included.'
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
      const messageBoxes = await knex('messageBox').whereIn('type', req.body.messageBoxTypes).select('messageBoxId')

      // Check for messages that haven't been recieved yet
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey
      }).select('body', 'sender', 'messageBoxId', 'recieved_at', 'updated_at')

      // TODO: Test for what cases this actually happens.
      if (!messages) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_REQUEST',
          description: 'Invalid request parameters!'
        })
      }

      // Filter for only the messages requested
      if (messageBoxes && messageBoxes.length !== 0) {
        messages = messages.filter(m => messageBoxes.includes(m.messageBoxId))
      }

      // Return the required info to the sender
      return res.status(200).json({
        status: 'success',
        messages
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_ERROR',
        description: 'An internal error has occurred while retrieving messages.'
      })
    }
  }
}
