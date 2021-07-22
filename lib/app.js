const { resolve } = require("path");

const http = require("http");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const exegesisExpress = require("exegesis-express");
const { Sequelize } = require("sequelize");

class App {
  constructor({ config }) {
    this.app = null;
    this.config = config;
  }

  async load() {
    const sequelize = new Sequelize(
      this.config.dbName,
      this.config.dbUser,
      this.config.dbPassword,
      {
        host: this.config.dbHost,
        port: this.config.dbPort,
        dialect: "postgres",
      }
    );

    try {
      await sequelize.authenticate();
      console.log("Connection has been established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
    const exegesisMiddleware = await exegesisExpress.middleware(
      resolve(__dirname, "../spec/openapi.yaml"),
      {
        controllers: resolve(__dirname, "../lib/controllers"),
      }
    );
    this.app = express();

    this.app.use(bodyParser.json());
    this.app.use(
      bodyParser.urlencoded({
        extended: true,
      })
    );

    this.app.use(
      cors({
        credentials: true,
      })
    );
    this.app.use((req, res, next) => {
      req.controllerData = {
        utils: this.utils,
        mongo: this.mongo,
        config: this.config,
        req,
        res,
        next,
      };
      next();
    });
    this.app.use(exegesisMiddleware);
    const server = http.createServer(this.app);
    await server.listen(this.config.port);
    console.log(`Server started, port: ${this.config.port}`);
  }
}

module.exports = App;
