const request = require('supertest');
const axios = require('axios');
const app = require('./index');

describe('POST /api/travel-times', () => {
  beforeEach(() => {
    process.env.MAPS_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns results array for valid input', async () => {
    const mockData = {
      status: 'OK',
      rows: [{
        elements: [{
          status: 'OK',
          duration: { text: '1 min' },
          distance: { text: '1 km' }
        }]
      }]
    };
    jest.spyOn(axios, 'get').mockResolvedValue({ data: mockData });

    const res = await request(app)
      .post('/api/travel-times')
      .send({ origin: 'A', destinations: ['B'] });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('results');
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('returns 400 for missing parameters', async () => {
    const res = await request(app)
      .post('/api/travel-times')
      .send({});
    expect(res.status).toBe(400);
  });
});
