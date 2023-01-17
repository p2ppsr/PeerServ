// Remove the acknowledged column since it is no longer needed
exports.up = async knex => {
  await knex.schema.table('messages', table => {
    table.dropColumn('acknowledged')
  })
}

exports.down = async knex => {
  await knex.schema.table('messages', table => {
    table.boolean('acknowledged').defaultTo(false)
  })
}
