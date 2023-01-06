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
      recipient: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
      messageBox: 'payment_inbox',
      body: ''
    }
  },
  exampleResponse: {
    status: 'success'
  },
  func: async (req, res) => {
    try {
      // Validate request body
      if (!req.body.message) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGE_REQUIRED',
          description: 'Please provide a message to send!'
        })
      }
      if (!req.body.message.recipient) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_RECIPIENT_REQUIRED',
          description: 'Please provide a recipient to send the message to!'
        })
      }
      if (!req.body.message.messageBox) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGEBOX_REQUIRED',
          description: 'Please provide a messageBox to send this message into!'
        })
      }
      if (!req.body.message.body) {
        return res.status(400).json({
          status: 'error',
          code: 'ERR_MESSAGE_BODY_REQUIRED',
          description: 'Every message must contain a body!'
        })
      }

      // Select the message box to send this message to
      let messageBox = await knex('messageBox')
        .where({
          identityKey: req.body.message.recipient,
          type: req.body.message.messageBox
        }).update({
          updated_at: new Date()
        })
      // If this messageBox does not exist yet, create it. Note: Is this the sender's job, or the recipient?
      if (!messageBox) {
        await knex('messageBox').insert({
          identityKey: req.body.message.recipient,
          type: req.body.message.messageBox,
          created_at: new Date(),
          updated_at: new Date()
        })
      }

      // Note: Simplify with knex?
      [messageBox] = await knex('messageBox').where({
        identityKey: req.body.message.recipient,
        type: req.body.message.messageBox
      }).select('messageBoxId')

      // Insert the new message
      // Note: Should any encryption be enforced here?
      await knex('messages').insert({
        messageBoxId: messageBox.messageBoxId, // Foreign key
        sender: req.authrite.identityKey,
        recipient: req.body.message.recipient,
        body: JSON.stringify(req.body.message.body), // String or buffer?
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
