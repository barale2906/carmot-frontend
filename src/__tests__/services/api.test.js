import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/composables/useNotification', () => ({
  notify: { error: vi.fn(), warning: vi.fn() },
}))

import api from '@/services/api.js'
import { notify } from '@/composables/useNotification'

// Respuesta 429 simulada por el adaptador de axios
const error429 = (config) => Promise.reject(Object.assign(new Error('429'), {
  config, response: { status: 429, data: {}, headers: { 'retry-after': '1' } },
}))

describe('api: límite de peticiones (F04)', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.clearAllMocks() })
  afterEach(() => vi.useRealTimers())

  it('reintenta una vez tras un 429 y devuelve la respuesta', async () => {
    const adapter = vi.fn()
      .mockImplementationOnce(error429)
      .mockImplementationOnce((config) => Promise.resolve({ data: { ok: true }, status: 200, headers: {}, config }))

    const promesa = api.get('/algo', { adapter })
    await vi.advanceTimersByTimeAsync(1000)

    expect((await promesa).data).toEqual({ ok: true })
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(notify.warning).not.toHaveBeenCalled()
  })

  it('si el reintento también da 429, avisa al usuario', async () => {
    const adapter = vi.fn().mockImplementation(error429)

    const promesa = api.get('/algo', { adapter }).catch((e) => e)
    await vi.advanceTimersByTimeAsync(1000)

    expect((await promesa).response.status).toBe(429)
    expect(adapter).toHaveBeenCalledTimes(2)
    expect(notify.warning).toHaveBeenCalledWith(expect.stringContaining('demasiadas solicitudes'), 'Un momento')
  })
})
