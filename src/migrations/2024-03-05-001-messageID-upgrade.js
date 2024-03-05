exports.up = async (knex) => {
  // Drop the existing 'messageId' column
  await knex.schema.table('messages', function (table) {
    table.dropColumn('messageId')
  })

  // Add the 'messageId' column back as a unique string
  await knex.schema.table('messages', function (table) {
    table.string('messageId').unique()
  })
}

// Rollback above changes
exports.down = async (knex) => {
  await knex.schema.table('messages', function (table) {
    table.dropColumn('messageId')
  })

  await knex.schema.table('messages', (table) => {
    table.increments('messageId')
  })
}
