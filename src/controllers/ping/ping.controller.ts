import {Request, Response} from "express";

function ping(_req: Request, res: Response) {
    return res.status(200).json({status: 'ok'})
}

export {
    ping
}
