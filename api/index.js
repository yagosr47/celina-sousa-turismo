const { app } = require('../server/index');
const { ensureDatabaseReady } = require('../server/db');

module.exports = async (req, res) => {
  await ensureDatabaseReady();
  return app(req, res);
};
