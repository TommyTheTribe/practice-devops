module.exports = {
  port: process.env.USERS_PORT || 8080,
  dbHost: process.env.DB_HOST || "", // "51.159.114.70",
  dbPort: process.env.DB_PORT || "", // "32473",
  dbName: process.env.DB_NAME || "", // "rdb",
  dbUser: process.env.DB_USER || "", // "practice",
  dbPassword: process.env.DB_PASSWORD || "", // "Practicepracti1@",
};
