/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: "mysql2",
  connection: {
    host: "127.0.0.1",
    database: "volcanoes",
    user: "root",
    password: "pwd1",
  },
  timezone: "+10:00",
};
