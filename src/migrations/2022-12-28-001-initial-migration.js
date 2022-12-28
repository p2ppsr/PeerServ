exports.up = async knex => {
  await knex.schema.createTable('messageBox', table => {
    table.increments('messageBoxId') // What type of messages go in here?
    table.timestamps()
    table.string('userId') // Who's message box is this?
    table.boolean('newMessages').defaultTo(false) // Are there new messages available?
  })

  // Do we really need a users' table?
  await knex.schema.createTable('users', table => {
    table.increments('userId')
    table.timestamps()
    table.string('identityKey')
  })

  await knex.schema.createTable('messages', table => {
    table.increments('messageId')
    table.timestamps()
    table.string('sender')
    table.string('recipient')
    table.string('messageBoxId') // Ex. MetaNet ICU coupon tokens --> XYZ
    table.boolean('recieved').defaultTo(false)
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('messageBox')
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('messages')
}
