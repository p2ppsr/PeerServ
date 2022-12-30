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
      console.log(req.authrite.identityKey)
      let messageBoxes = []
      // Get message box ids that belong to me and are in my list of types.
      if (req.body.messageBoxTypes) {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).whereIn('type', req.body.messageBoxTypes).select('type')
      } else {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).select('type')
      }

      // Get messages
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey
      }).select('body', 'sender', 'type', 'created_at', 'updated_at')

      // Filter for only the messages in the message boxes requested
      if (messageBoxes && messageBoxes.length !== 0) {
        messages = messages.filter(m => messageBoxes.some(x => x.type === m.type))
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
