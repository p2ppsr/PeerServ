const crypto = require('crypto')
const bsv = require('babbage-bsv')
const {
  SERVER_PRIVATE_KEY,
  NODE_ENV
} = process.env
const knex =
  NODE_ENV === 'production' || NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/checkMessages',
  knex,
  summary: 'Use this route to check for any messages that have not been recieved yet.',
  parameters: {
    messageBoxes: 'An array of the messageBoxIds you would like to check for new messages. If none are provided, all messageBoxes checked.'
  },
  exampleResponse: {
    status: 'success',
    messagesProcessed: ''
  },
  errors: [
    'ERR_MESSAGEBOX_NOT_FOUND'
  ],
  func: async (req, res) => {
    try {
      // Check for messages that haven't been recieved yet
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey,
        recieved: false
      }).select('message', 'sender', 'recipient', 'messageBoxId')

      // TODO: Test for what cases this actually happens.
      if (!messages) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_INVALID_REQUEST',
          description: 'A matching message box could not be found!'
        })
      }
      // Filter for only the messages requested
      if (req.body.messageBoxes && req.body.messageBoxes.length !== 0) {
        messages = messages.filter(m => req.body.messageBoxes.includes(m.messageBoxId))
      }

      // Mark the message as recieved
      // Note: Should this be down after it has been confirmed the the *transaction was processed?\
      // TODO: Consider refactor for simplicity
      if (messages.length !== 0) {
        if (req.body.messageBoxes && req.body.messageBoxes.length !== 0) {
          await knex('messages').where({
            recipient: req.authrite.identityKey,
            recieved: false
          }).whereIn('messageBoxId', req.body.messageBoxes)
            .update({ recieved: true })
        } else {
          await knex('messages').where({
            recipient: req.authrite.identityKey,
            recieved: false
          }).update({ recieved: true })
        }
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
        code: 'ERR_INTERNAL_PROCESSING_INVOICE',
        description: 'An internal error has occurred while processing invoice.'
      })
    }
  }
}
