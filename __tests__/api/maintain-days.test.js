import { GET, POST } from '../../src/app/api/maintain-days/route'

describe('maintain-days API route', () => {
	const buildReq = (method, { code } = {}) => {
		const url = new URL('http://localhost/api/maintain-days' + (code ? `?code=${code}` : ''))
		return {
			method,
			url: url.toString(),
			headers: new Map([
				['x-maintenance-code', code || ''],
			]),
			// mimic Request.headers.get
			headers: {
				get: (k) => (k.toLowerCase() === 'x-maintenance-code' ? code || '' : null),
			},
		}
	}

	beforeEach(() => {
		process.env.NEXT_PUBLIC_EDIT_CODE = 'secret'
	})

	it('returns 401 when unauthorized', async () => {
		const res = await GET(buildReq('GET'))
		expect(res.status).toBe(401)
		const data = await res.json()
		expect(data.ok).toBe(false)
	})

	it('returns ok when authorized via header', async () => {
		const req = buildReq('GET', { code: 'secret' })
		const res = await GET(req)
		expect(res.status).toBe(200)
		const data = await res.json()
		expect(data.ok).toBe(true)
		expect(data).toHaveProperty('ensured')
	})

	it('POST behaves similarly to GET', async () => {
		const req = buildReq('POST', { code: 'secret' })
		const res = await POST(req)
		expect(res.status).toBe(200)
		const data = await res.json()
		expect(data.ok).toBe(true)
	})

	it('authorizes via query param', async () => {
		const req = {
			method: 'GET',
			url: 'http://localhost/api/maintain-days?code=secret',
			headers: { get: () => null },
		}
		const res = await GET(req)
		expect(res.status).toBe(200)
	})

	it('returns 500 on internal error', async () => {
		const prisma = (await import('../../src/lib/prisma')).default
		prisma.day.upsert.mockRejectedValueOnce(new Error('db error'))
		const req = buildReq('GET', { code: 'secret' })
		const res = await GET(req)
		expect(res.status).toBe(500)
		const data = await res.json()
		expect(data.ok).toBe(false)
	})
})

