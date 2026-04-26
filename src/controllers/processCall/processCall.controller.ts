import {Request, Response} from 'express';
import {aiService} from '../../services/ai.service';

async function processCallPost(req: Request, res: Response) {

    try {
        const {transcript} = req.body;

        if (!transcript || typeof transcript !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'transcript field is required and must be a string'
            });
        }

        const result = await aiService.processTranscript(transcript);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error processing call:', error);
        return res.status(500).json({
            error: 'Processing failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

export {
    processCallPost
}
