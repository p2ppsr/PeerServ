exports.up = async knex => {
  await knex.schema.createTable('messageBox', table => {
    table.increments('messageBoxId')
    table.timestamps()
    table.string('type') // What type of messages go in here?
    table.string('identityKey') // Who's message box is this?
    table.unique(['type', 'identityKey'])
  })

  await knex.schema.createTable('messages', table => {
    table.increments('messageId')
    table.timestamps()
    table.integer('messageBoxId').unsigned().references('messageBoxId').inTable('messageBox').onDelete('CASCADE') // All messages get deleted if the messageBox is deleted
    table.string('sender')
    table.string('recipient')
    table.longtext('body') // Contents of the message
    table.boolean('acknowledged').defaultTo(false)
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('messageBox')
  await knex.schema.dropTable('messages')
}
