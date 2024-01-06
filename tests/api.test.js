const express = require('express');
const serverRoutes = require('../src/router');
const request = require('supertest');
const app = express();
app.use(serverRoutes);
describe('testing-server-routes', () => {
  it('GET /healthcheck - success', async () => {
    const { text } = await request(app).get('/healthcheck');
    expect(text).toEqual('hello');
  });
});
