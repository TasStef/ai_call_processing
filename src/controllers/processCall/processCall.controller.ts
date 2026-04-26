import {Request, Response} from 'express';

function processCallPost(_req: Request, res: Response) {
    return res.status(200).json(_req.body)
}

export {
    processCallPost
}
