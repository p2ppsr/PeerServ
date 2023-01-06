/* eslint-env jest */
const listMessages = require('../listMessages')
const mockKnex = require('mock-knex')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let queryTracker, validReq, validRes, validMessageBoxes, validMessages

describe('listMessages', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(e => {
      throw e
    })
    mockKnex.mock(listMessages.knex)
    queryTracker = require('mock-knex').getTracker()
    queryTracker.install()

    validMessages = [{
      sender: '028d37b941208cd6b8a4c28288eda5f2f16c2b3ab0fcb6d13c18b47fe37b971fc1',
      messageBoxId: 42,
      body: '{}'
    }]

    // Mock Data
    validRes = {
      status: 'success',
      messages: validMessages
    }
    validMessageBoxes = [
      {
        messageBoxId: 42,
        messageBox: 'payment_inbox'
      },
      {
        messageBoxId: 31,
        messageBox: 'payment_inbox'
      }
    ]

    // Mock Request]
    validReq = {
      authrite: {
        identityKey: 'mockIdKey'
      },
      body: {
        messageBoxes: ['payment_inbox'],
        acknowledged: false
      }
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(listMessages.knex)
  })
  it('Selects all messages if no messageBoxes are provided', async () => {
    validReq.body.messageBoxes = []
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('select')
        expect(q.sql).toEqual(
          'select `messageId`, `messageBoxId`, `body`, `sender`, `created_at`, `updated_at` from `messages` where `recipient` = ? and `acknowledged` = ?'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          false
        ])
        q.response(validMessages)
      } else if (s === 2) {
        q.response(validMessageBoxes)
      } else {
        q.response([])
      }
    })

    await listMessages.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(validRes))
  })
  it('Returns empty array if no messages found', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([])
      } else {
        q.response([])
      }
    })
    await listMessages.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      messages: []
    }))
  })
  it('Queries for messageBoxes if provided', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response(validMessages)
      } else if (s === 2) {
        expect(q.method).toEqual('select')
        expect(q.sql).toEqual(
          'select `messageBoxId` from `messageBox` where `identityKey` = ? and `type` in (?)'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          'payment_inbox'
        ])
        q.response(validMessageBoxes)
      } else {
        q.response([])
      }
    })
    await listMessages.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success',
      messages: validMessages
    }))
  })
  it('Throws unknown errors', async () => {
    queryTracker.on('query', (q, s) => {
      throw new Error('Failed')
    })
    await expect(listMessages.func(validReq, mockRes)).rejects.toThrow()
  })
})
