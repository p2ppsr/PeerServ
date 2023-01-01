module.exports = {
  preAuthrite: [
    require('./migrate')
  ],
  postAuthrite: [
    require('./sendMessage'),
    require('./checkMessages')
  ]
}
