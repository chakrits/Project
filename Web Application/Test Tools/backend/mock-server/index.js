/**
 * Mock Server Module
 * Entry point that exports both routers for mounting in the main Express server.
 * 
 * Usage in server.js:
 *   const mockServer = require('./mock-server');
 *   app.use('/mock-api', mockServer.mockRouter);
 *   app.use('/api/mock-server', mockServer.managementApi);
 */

const mockRouter = require('./routes/mockRouter');
const managementApi = require('./routes/managementApi');

module.exports = {
  mockRouter,
  managementApi
};
