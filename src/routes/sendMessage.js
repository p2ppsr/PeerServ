const {
  NODE_ENV
} = process.env
const knex =
  NODE_ENV === 'production' || NODE_ENV === 'staging'
    ? require('knex')(require('../../knexfile.js').production)
    : require('knex')(require('../../knexfile.js').development)

module.exports = {
  type: 'post',
  path: '/sendMessage',
  knex,
  summary: "Use this route to send a message to a recipient's message box.",
  parameters: {
    message: {
      recipient: 'abc',
      type: 'xyz',
      body: ''
    }
  },
  exampleResponse: {
    status: 'success'
  },
  errors: [
  ],
  func: async (req, res) => {
    try {
      // Find valid messageBox for the recipient
      // const [sender] = await knex('users').where({
      //   identityKey: req.authrite.identityKey
      // }).select('userId')

      // if (!sender) {
      //   [recipient] = await knex('users').insert({
      //     identityKey: req.body.message.recipient
      //   }, ['userId'])
      // }

      // let [recipient] = await knex('users').where({
      //   identityKey: req.body.message.recipient
      // }).select('userId')

      // if (!recipient) {
      //   [recipient] = await knex('users').insert({
      //     identityKey: req.body.message.recipient
      //   }, ['userId'])
      // }

      // Select the message box for the given message type
      let messageBox = await knex('messageBox')
        .where({
          identityKey: req.body.message.recipient,
          type: req.body.message.type
        }).update({
          updated_at: new Date(),
          newMessages: true
        })
      // If this messageBox does not exist yet, create it. Note: Is this the sender's job, or the recipient?
      if (!messageBox) {
        await knex('messageBox').insert({
          identityKey: req.body.message.recipient,
          type: req.body.message.type,
          created_at: new Date(),
          updated_at: new Date(),
          newMessages: true
        })
      }

      // Retrieve the newly created/updated messageBox (note: knex should simplify this)
      [messageBox] = await knex('messageBox').where({
        identityKey: req.body.message.recipient,
        type: req.body.message.type
      }).select('type')

      // Insert the new message
      // TODO: encrypt the message
      await knex('messages').insert({
        sender: req.authrite.identityKey,
        recipient: req.body.message.recipient,
        type: messageBox.type,
        body: JSON.stringify(req.body.message.body),
        created_at: new Date(),
        updated_at: new Date()
      })

      return res.status(200).json({
        status: 'success',
        message: `Your message has been sent to ${req.body.message.recipient}`
      })
    } catch (e) {
      console.error(e)
      if (global.Bugsnag) global.Bugsnag.notify(e)
      res.status(500).json({
        status: 'error',
        code: 'ERR_INTERNAL',
        description: 'An internal error has occurred.'
      })
    }
  }
}
