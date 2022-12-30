const {
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
  summary: 'Use this route to check for any messages that have not been acknowledged yet.',
  parameters: {
    messageBoxTypes: 'An array of the messageBox types you would like to check for new messages. If none are provided, all messageBoxes checked.'
  },
  exampleResponse: {
    status: 'success',
    messages: [{
      body: '',
      sender: 'xyz',
      type: 'abc',
      created_at: '2022-12-29T17:30:25'
    }]
  },
  errors: [],
  func: async (req, res) => {
    try {
      // TODO: Make use of list.
      let messageBoxes = []
      // Get message box ids that belong to me and are in my list of types.
      if (req.body.messageBoxTypes) {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).whereIn('type', req.body.messageBoxTypes).select('type')
      } else {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).select('type')
      }

      // Check for messages that haven't been recieved yet
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey,
        acknowledged: false
      }).select('body', 'sender', 'type', 'created_at')

      // Just return if there are no new messages
      if (messages && messages.length === 0) {
        return res.status(200).json({
          status: 'success',
          messages
        })
      }

      // Filter for only the messages in the message boxes requested
      if (messageBoxes && messageBoxes.length !== 0) {
        messages = messages.filter(m => messageBoxes.some(x => x.type === m.type))
      }

      // Mark the message as acknowledged
      // Note: Should this be done after it has been confirmed the token has been processed?
      // TODO: Consider refactor for simplicity
      if (messages.length !== 0) {
        if (messageBoxes && messageBoxes.length !== 0) {
          await knex('messages').where({
            recipient: req.authrite.identityKey,
            acknowledged: false
          }).whereIn('type', messageBoxes.map(mB => mB.type))
            .update({ acknowledged: true, updated_at: new Date() })
        } else {
          await knex('messages').where({
            recipient: req.authrite.identityKey,
            acknowledged: false
          }).update({ acknowledged: true, updated_at: new Date() })
        }
      }

      // There are no new messages for the given messageBoxes
      await knex('messageBox')
        .where({
          identityKey: req.authrite.identityKey,
          newMessages: true
        })
        .whereIn('type', messageBoxes.map(mB => mB.type))
        .update({
          newMessages: false,
          updated_at: new Date()
        })

      // Return the required info to the sender
      return res.status(200).json({
        status: 'success',
        messages
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL',
        description: 'An internal error has occurred while checking messages.'
      })
    }
  }
}
