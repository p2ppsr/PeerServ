
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
  summary: 'Use this route to check for new messages or list all messages from one or more of your message boxes.',
  parameters: {
    filterBy: {
      messageBoxTypes: 'An array of the messageBoxTypes you would like to get messages from. If none are provided, all messageBoxes will be included.',
      acknowledged: false
    },
    isReceiving: true
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
      // Note: Maybe there should be a filter applied here?
      let messages = await knex('messages').where({
        recipient: req.authrite.identityKey
      }).select('body', 'sender', 'type', 'acknowledged', 'created_at', 'updated_at')

      if (!req.body.filterBy) {
        // Return all messages
        return res.status(200).json({
          status: 'success',
          messages
        })
      }

      // If the user is receiving the message contents, and not just listing,
      // only unacknowledged messages should be returned.
      // Note: Is there a better way to handle this?
      if (req.body.isReceiving) {
        req.body.filterBy = {
          ...req.body.filterBy,
          acknowledged: false
        }
      }

      let messageBoxes = []
      // Get message box ids that belong to me and are in my list of types.
      if (req.body.filterBy && req.body.filterBy.messageBoxTypes) {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).whereIn('type', req.body.filterBy.messageBoxTypes).select('type')
      } else {
        messageBoxes = await knex('messageBox').where({ identityKey: req.authrite.identityKey }).select('type')
      }

      // Only return messages that match the filters provided
      messages = messages.filter(m => {
        let validMessage = false
        if (req.body.filterBy.messageBoxTypes && req.body.filterBy.messageBoxTypes.length !== 0) {
          validMessage = messageBoxes.some(x => x.type === m.type)
        }
        if ('acknowledged' in req.body.filterBy) {
          validMessage = Boolean(m.acknowledged) === req.body.filterBy.acknowledged
        }
        return validMessage
      })

      // Just return if the messages aren't being processed?
      if (!req.body.isReceiving || messages.length === 0) {
        return res.status(200).json({
          status: 'success',
          messages
        })
      }

      // Mark the message as acknowledged
      // Note: Should this be done after it has been confirmed the token has been processed?
      // TODO: Consider refactor for simplicity
      if (messageBoxes && messageBoxes.length !== 0) {
        await knex('messages').where({
          recipient: req.authrite.identityKey,
          acknowledged: false
        }).whereIn('type', messageBoxes.map(mB => mB.type))
          .update({ acknowledged: true, updated_at: new Date() })
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

      return res.status(200).json({
        status: 'success',
        messages
      })
    } catch (e) {
      console.error(e)
      return res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL_ERROR',
        description: 'An internal error has occurred while checking messages.'
      })
    }
  }
}
