module.exports = {
  preAuthrite: [
    require('./migrate')
  ],
  postAuthrite: [
    require('./newMessage'),
    require('./processMessages')
  ]
}
