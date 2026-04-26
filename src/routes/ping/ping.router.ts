import express from "express";
import {ping} from "../../controllers/ping/ping.router";

const pingRouter = express.Router()

pingRouter.get('/', ping)

export {
    pingRouter
}
