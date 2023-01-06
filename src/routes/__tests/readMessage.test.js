/* eslint-env jest */
const readMessage = require('../readMessage')
const mockKnex = require('mock-knex')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let queryTracker, validReq, validRes, validMessages

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
      messages: [{
        sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
        messageBoxId: 42,
        messageId: 123,
        body: '{}'
      }]
    }
    validMessages = [
      {
        sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
        messageBoxId: 42,
        messageId: 123,
        body: '{}'
      },
      {
        sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
        messageBoxId: 42,
        messageId: 33,
        body: '{}'
      }
    ]
    // Mock Request
    validReq = {
      authrite: {
        identityKey: 'mockIdKey'
      },
      body: {
        messageIds: [123]
      }
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(readMessage.knex)
  })
  it('Throws an error if messageIds is missing', async () => {
    delete validReq.body.messageIds
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGE_ID_REQUIRED',
      description: 'Please provide the ID of the message(s) to read!'
    }))
  })
  it('Throws an error if messageId is not an Array', async () => {
    validReq.body.messageIds = '42'
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_MESSAGE_ID',
      description: 'Message IDs must be formatted as an Array of Numbers!'
    }))
  })
  it('Throws an error if messageId is not an Array of Numbers', async () => {
    validReq.body.messageIds = [42, '32']
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_MESSAGE_ID',
      description: 'Message IDs must be formatted as an Array of Numbers!'
    }))
  })
  it('Queries for messages with matching messageIds', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('select')
        expect(q.sql).toEqual(
          'select `messageId`, `messageBoxId`, `body`, `sender`, `created_at`, `updated_at` from `messages` where `recipient` = ? and `acknowledged` = ? and `messageId` in (?)'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          false,
          123
        ])
        q.response([validMessages[0]])
      } else if (s === 2) {
        q.response(true)
      } else {
        q.response([])
      }
    })
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(validRes))
  })
  it('Acknowledges a message as read', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validMessages[0]])
      } else if (s === 2) {
        expect(q.method).toEqual('update')
        expect(q.sql).toEqual(
          'update `messages` set `acknowledged` = ?, `updated_at` = ? where `recipient` = ? and `acknowledged` = ? and `messageId` in (?)'
        )
        expect(q.bindings).toEqual([
          true,
          expect.any(Date),
          'mockIdKey',
          false,
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
