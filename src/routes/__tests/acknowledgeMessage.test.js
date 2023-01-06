/* eslint-env jest */
const acknowledgeMessage = require('../acknowledgeMessage')
const mockKnex = require('mock-knex')

const mockRes = {}
mockRes.status = jest.fn(() => mockRes)
mockRes.json = jest.fn(() => mockRes)
let queryTracker, validReq

describe('acknowledgeMessage', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(e => {
      throw e
    })
    mockKnex.mock(acknowledgeMessage.knex)
    queryTracker = require('mock-knex').getTracker()
    queryTracker.install()

    // Mock Request
    validReq = {
      authrite: {
        identityKey: 'mockIdKey'
      },
      body: {
        messageBoxId: 42,
        messageId: 123
      }
    }
  })
  afterEach(() => {
    jest.clearAllMocks()
    queryTracker.uninstall()
    mockKnex.unmock(acknowledgeMessage.knex)
  })
  it('Throws an error if messageBox ID is missing', async () => {
    delete validReq.body.messageBoxId
    await acknowledgeMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGEBOX_ID_REQUIRED'
    }))
  })
  it('Throws an error if messageBox ID is not a number', async () => {
    validReq.body.messageBoxId = '24'
    await acknowledgeMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_MESSAGEBOX_ID',
      description: 'MessageBox ID must be formatted as a Number!'
    }))
  })
  it('Throws an error if messageId is missing', async () => {
    delete validReq.body.messageId
    await acknowledgeMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_MESSAGE_ID_REQUIRED'
    }))
  })
  it('Throws an error if message ID is not a number', async () => {
    validReq.body.messageId = '24'
    await acknowledgeMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_MESSAGE_ID',
      description: 'Message ID must be formatted as a Number!'
    }))
  })
  it('Deletes an acknowledged message', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('del')
        expect(q.sql).toEqual(
          'delete from `messages` where `recipient` = ? and `messageBoxId` = ? and `messageId` = ? and `acknowledged` = ?'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          42,
          123,
          true
        ])
        q.response(true)
      } else {
        q.response([])
      }
    })

    await acknowledgeMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'success'
    }))
  })
  it('Throws an error if deletion fails', async () => {
    queryTracker.on('query', (q, s) => {
      if (s === 1) {
        expect(q.method).toEqual('del')
        expect(q.sql).toEqual(
          'delete from `messages` where `recipient` = ? and `messageBoxId` = ? and `messageId` = ? and `acknowledged` = ?'
        )
        expect(q.bindings).toEqual([
          'mockIdKey',
          42,
          123,
          true
        ])
        q.response(false)
      } else {
        q.response([])
      }
    })

    await acknowledgeMessage.func(validReq, mockRes)
    expect(mockRes.status).toHaveBeenCalledWith(400)
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      status: 'error',
      code: 'ERR_INVALID_ACKNOWLEDGMENT',
      description: 'Message has already been acknowledged!'
    }))
  })
  it('Throws unknown errors', async () => {
    queryTracker.on('query', (q, s) => {
      throw new Error('Failed')
    })
    await expect(acknowledgeMessage.func(validReq, mockRes)).rejects.toThrow()
  })
})
