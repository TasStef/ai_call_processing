import {Request, Response} from 'express';
import {aiService} from '../../services/ai.service';
import Ajv from 'ajv';
import {callExtractionSchema} from '../../models/callExtraction.schema';

const ajv = new Ajv({allErrors: true, strict: false});
const validate = ajv.compile(callExtractionSchema);

async function processCallPost(req: Request, res: Response) {
    try {
        const {transcript} = req.body;

        if (!transcript || typeof transcript !== 'string') {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'transcript field is required and must be a string'
            });
        }

        const MAX_TRANSCRIPT_LEN = Number(process.env.MAX_TRANSCRIPT_LEN);
        if (transcript.trim().length === 0) {
            return res.status(400).json({
                error: 'Invalid request',
                message: 'transcript must not be empty'
            });
        }
        if (transcript.length > MAX_TRANSCRIPT_LEN) {
            return res.status(400).json({
                error: 'Payload too large',
                message: `transcript exceeds maximum length of ${MAX_TRANSCRIPT_LEN} characters`
            });
        }

        const result = await aiService.processTranscript(transcript);

        const valid = validate(result);
        if (!valid) {
            try {
                const repairHint = `${transcript}\n\nReturn ONLY JSON that strictly matches the provided schema. No explanations, no markdown.`;
                const retry = await aiService.processTranscript(repairHint);

                if (validate(retry) && retry.is_valid_call) {
                    return res.status(200).json(retry);
                }
            } catch (_e) {
                // swallow retry errors; fall through to 502 below
            }

            return res.status(502).json({
                error: 'Invalid AI output',
                details: ajv.errorsText(validate.errors ?? [], {separator: '; '}),
            });
        }

        if (!result.is_valid_call) {
            return res.status(400).json({error: 'Transcript does not appear to be a valid patient call'});
        }

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
