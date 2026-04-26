import express from "express";
import {processCallPost} from '../../controllers/processCall/processCall.controller'

const processCallRouter = express.Router()

processCallRouter.post('/', processCallPost)

export {
    processCallRouter
}
