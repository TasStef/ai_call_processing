import express from "express";
import {ping} from "../../controllers/ping/ping.controller";

const pingRouter = express.Router()

pingRouter.get('/', ping)

export {
    pingRouter
}
