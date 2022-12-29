exports.up = async knex => {
  await knex.schema.createTable('messageBox', table => {
    table.increments('messageBoxId')
    table.string('type').unique() // What type of messages go in here?
    table.timestamps()
    table.string('identityKey') // Who's message box is this?
    table.boolean('newMessages').defaultTo(false) // Are there new messages available?
  })

  // Do we really need a users' table?
  // Maybe for roles etc.?
  // await knex.schema.createTable('users', table => {
  //   table.increments('userId')
  //   table.timestamps()
  //   table.string('identityKey')
  // })

  await knex.schema.createTable('messages', table => {
    table.increments('messageId')
    table.timestamps()
    table.string('sender')
    table.string('recipient')
    table.string('type') // Ex. MetaNet ICU coupon tokens --> XYZ
    table.longtext('body') // Contents of the message
    table.boolean('acknowledged').defaultTo(false)
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('messageBox')
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('messages')
}
