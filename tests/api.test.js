const express = require("express"); // import express
const serverRoutes = require("../src/router"); //import file we are testing
const request = require("supertest"); // supertest is a framework that allows to easily test web apis
const app = express(); //an instance of an express app, a 'fake' express app
app.use(serverRoutes); //routes
describe("testing-server-routes", () => {
  it("GET /healthcheck - success", async () => {
    const { text } = await request(app).get("/healthcheck"); //uses the request function that calls on express app instance
    expect(text).toEqual('hello');
  });
});
