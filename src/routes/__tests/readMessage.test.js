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
        messageBox: 'payment_inbox',
        messageId: 123
      }
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(readMessage.knex)
  })
  it('Returns error if messageBox type is missing', async () => {
    delete validReq.body.messageBox
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGEBOX_REQUIRED'
    }))
  })
  it('Returns error if messageId is missing', async () => {
    delete validReq.body.messageId
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGE_ID_REQUIRED'
    }))
  })
  it('Selects an existing messageBox', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('select')
        expect(q.sql).toEqual(
          'select `messageBoxId` from `messageBox` where `identityKey` = ? and `type` = ?'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          'payment_inbox'
        ])
        q.response([validMessageBox])
      } else if (s === 2) {
        q.response([validMessage])
      } else {
        q.response([])
      }
    })

    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining(validRes))
  })
  it('Throws an error if messageBox can not be found', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('select')
        expect(q.sql).toEqual(
          'select `messageBoxId` from `messageBox` where `identityKey` = ? and `type` = ?'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          'payment_inbox'
        ])
        q.response([])
      } else {
        q.response([])
      }
    })
    await readMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGEBOX_NOT_FOUND',
      description: 'Requested messageBox could not be found!'
    }))
  })
  it('Acknowledges a message as read', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        q.response([validMessageBox])
      } else if (s === 2) {
        q.response([validMessage])
      } else if (s === 3) {
        expect(q.method).toEqual('update')
        expect(q.sql).toEqual(
          'update `messages` set `acknowledged` = ? where `recipient` = ? and `messageBoxId` = ? and `messageId` = ?'
        )
        expect(q.bindings).toEqual([
          true,
          'mockIdKey',
          42,
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
