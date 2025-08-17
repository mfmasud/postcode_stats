import buildServer from '../app.js'

import { test, expect } from 'vitest'

test('GET /ping', async () => {
  const app = buildServer()
  await app.ready()
  const res = await app.inject({ method: 'GET', url: '/ping' })
  expect(res.statusCode).toBe(200)
  expect(res.body).toBe('pong\n')
  await app.close()
})