/* eslint-env jest */
const readMessage = require('../readMessage')
const mockKnex = require('mock-knex')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let queryTracker, validReq, validRes, validMessageBox, validMessage

describe('readMessage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(e => {
      throw e
    })
    mockKnex.mock(readMessage.knex)
    queryTracker = require('mock-knex').getTracker()
    queryTracker.install()

    // Mock Data
    validRes = {
      status: 'success',
      message: {
        sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
        messageBoxId: 42,
        body: '{}'
      }
    }
    validMessageBox = {
      messageBoxId: 42,
      messageBox: 'payment_inbox'
    }
    validMessage = {
      sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
      messageBoxId: 42,
      body: '{}'
    }
    // Mock Request
    validReq = {
      authrite: {
        identityKey: 'mockIdKey'
      },
      body: {
        messageId: 123
      }
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(readMessage.knex)
  })
  it('Throws an error if messageId is missing', async () => {
    delete validReq.body.messageId
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGE_ID_REQUIRED'
    }))
  })
  it('Throws an error if messageId is not a Number', async () => {
    validReq.body.messageId = '42'
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_MESSAGE_ID',
      description: 'Message ID must be formatted as a Number!'
    }))
  })
  it('Acknowledges a message as read', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validMessage])
      } else if (s === 2) {
        expect(q.method).toEqual('update')
        expect(q.sql).toEqual(
          'update `messages` set `acknowledged` = ? where `recipient` = ? and `messageId` = ?'
        )
        expect(q.bindings).toEqual([
          true,
          'mockIdKey',
          123
        ])
        q.response(true)
      } else {
        q.response([])
      }
    })
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(validRes))
  })
  it('Throws unknown errors', async () => {
    queryTracker.on('query', (q, s) => {
      throw new Error('Failed')
    })
    await expect(readMessage.func(validReq, mockRes)).rejects.toThrow()
  })
})
