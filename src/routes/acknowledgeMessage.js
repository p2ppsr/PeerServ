
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
    messageBoxId: 1,
    messageId: 33
  },
  exampleResponse: {
    status: 'success'
  },
  errors: [],
  func: async (req, res) => {
    try {
      debugger
      // The server removes the message after it has been acknowledged
      knex('messages').where({
        recipient: req.authrite.identityKey,
        messageBoxId: req.body.messageBoxId,
        messageId: req.body.messageId,
        acknowledged: true
      }).del()
        .then(() => {
          return res.status(200).json({
            status: 'success'
          })
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
