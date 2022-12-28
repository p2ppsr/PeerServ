exports.up = async knex => {
  await knex.schema.createTable('messageBox', table => {
    table.increments('messageBoxId')
    table.timestamps()
    table.string('userId')
    table.boolean('newMessages').defaultTo(false)
  })

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
    table.string('messageBoxId')
  })
}

exports.down = async knex => {
  await knex.schema.dropTable('messageBox')
  await knex.schema.dropTable('users')
  await knex.schema.dropTable('messages')
}
