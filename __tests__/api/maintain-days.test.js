/**
 * This suite uses Node-like Request available from Next.js dependency.
 * Ensure jsdom testEnvironment is okay since we're not using DOM here.
 */
jest.mock('next/server', () => {
    const json = (body, init = {}) => ({
        status: init.status ?? 200,
        json: async () => body,
    })
    return { NextResponse: { json } }
})

// Mock prisma before importing handler
jest.mock('@/lib/prisma', () => ({
    __esModule: true,
    default: {
        day: {
            deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
            upsert: jest.fn().mockResolvedValue({}),
            findMany: jest.fn(),
        },
    },
}))

import { GET, POST } from '../../src/app/api/maintain-days/route'

function createRequest(method = 'GET', url = 'http://localhost/api/maintain-days', headers = {}, body) {
    const u = new URL(url)
    return {
        method,
        url,
        // Map-like headers access via get()
        json: async () => body,
        text: async () => (body ? JSON.stringify(body) : ''),
        get headers() {
            return {
                get: (key) => headers[key.toLowerCase()] || headers[key] || null,
            }
        },
        get nextUrl() {
            return u
        },
    }
}

describe('api/maintain-days route', () => {
	const OLD_ENV = process.env

	beforeEach(() => {
		jest.resetModules()
		process.env = { ...OLD_ENV, NEXT_PUBLIC_EDIT_CODE: 'secret' }
	})

	afterAll(() => {
		process.env = OLD_ENV
	})

	it('returns 401 when unauthorized', async () => {
		const req = createRequest('GET')
		const res = await GET(req)
		expect(res.status).toBe(401)
		const json = await res.json()
		expect(json.ok).toBe(false)
	})

	it('returns ok true when authorized on POST', async () => {
		// Mock prisma methods used by maintainDays
		const prisma = (await import('../../src/lib/prisma')).default
		prisma.day.deleteMany.mockResolvedValue({ count: 0 })
		prisma.day.upsert.mockResolvedValue({})

		const req = createRequest('POST', 'http://localhost/api/maintain-days?code=secret')
    const res = await POST(req)
    const json = await res.json()
    // Debug output if failing
    if (res.status !== 200) {
        // eslint-disable-next-line no-console
        console.log('API error', res.status, json)
    }
    expect(res.status).toBe(200)
		expect(json.ok).toBe(true)
		expect(json.ensured).toBe(14)
	})
})

