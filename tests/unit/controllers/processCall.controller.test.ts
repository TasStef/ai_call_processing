import express, {Request, Response, NextFunction} from 'express';
import request from 'supertest';

jest.mock('../../../src/services/ai.service', () => ({
    aiService: {
        processTranscript: jest.fn(),
    },
}));

import {processCallPost} from '../../../src/controllers/processCall/processCall.controller';
import {aiService} from '../../../src/services/ai.service';

function buildApp() {
    const app = express();
    app.use(express.json());
    app.post('/process-call', processCallPost);
    app.use((_req: Request, res: Response) => {
        res.status(404).json({error: 'Not found'});
    });
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err.stack);
        res.status(500).json({error: 'Internal server error'});
    });
    return app;
}

function validAiOutput(overrides: Partial<any> = {}) {
    return {
        is_valid_call: true,
        patient: {name: 'John Smith', date_of_birth: '1990-01-02'},
        clinical: {symptoms: ['cough'], duration: '5 days', urgency: 'routine'},
        intent: 'book_appointment',
        confidence: 0.85,
        recommended_action: {type: 'book_appointment', mode: 'gp_consultation'},
        ...overrides,
    };
}

describe('processCallPost controller', () => {
    const app = buildApp();
    const mockedProcess = aiService.processTranscript as jest.MockedFunction<
        typeof aiService.processTranscript
    >;

    const OLD_MAX = process.env.MAX_TRANSCRIPT_LEN;

    beforeEach(() => {
        mockedProcess.mockReset();
    });

    afterAll(() => {
        process.env.MAX_TRANSCRIPT_LEN = OLD_MAX;
    });

    it('400 when transcript is missing', async () => {
        mockedProcess.mockResolvedValue(validAiOutput());
        const res = await request(app).post('/process-call').send({});
        expect(res.status).toBe(400);
        expect(res.body).toEqual(
            expect.objectContaining({error: 'Invalid request'})
        );
    });

    it('400 when transcript is not a string (number/object/array)', async () => {
        mockedProcess.mockResolvedValue(validAiOutput());
        const cases = [123, {t: 'hi'}, ['a']];
        for (const bad of cases) {
            const res = await request(app)
                .post('/process-call')
                .send({transcript: bad as any});
            expect(res.status).toBe(400);
            expect(res.body.error).toBe('Invalid request');
        }
    });

    it('400 when transcript is empty or whitespace', async () => {
        mockedProcess.mockResolvedValue(validAiOutput());
        const res1 = await request(app)
            .post('/process-call')
            .send({transcript: ''});
        expect(res1.status).toBe(400);

        const res2 = await request(app)
            .post('/process-call')
            .send({transcript: '   '});
        expect(res2.status).toBe(400);
    });

    it('400 when transcript.length > MAX_TRANSCRIPT_LEN', async () => {
        process.env.MAX_TRANSCRIPT_LEN = '10';
        mockedProcess.mockResolvedValue(validAiOutput());
        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'x'.repeat(11)});
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Payload too large');
    });

    it('200 when AI returns valid JSON and is_valid_call: true', async () => {
        mockedProcess.mockResolvedValue(validAiOutput());
        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'Hi, I have a cough for 5 days'});
        expect(res.status).toBe(200);
        expect(res.body.is_valid_call).toBe(true);
        expect(res.body.patient.name).toBe('John Smith');
    });

    it('400 when valid JSON but is_valid_call: false', async () => {
        mockedProcess.mockResolvedValue(validAiOutput({is_valid_call: false}));
        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'I want pizza'});
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Transcript does not appear/);
    });

    it('retry once: first invalid schema then valid -> 200', async () => {
        mockedProcess
            .mockResolvedValueOnce({not: 'valid'} as any)
            .mockResolvedValueOnce(validAiOutput());

        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'Hi, I have a cough'});

        expect(res.status).toBe(200);
        expect(mockedProcess).toHaveBeenCalledTimes(2);
        const repairArg = mockedProcess.mock.calls[1][0];
        expect(repairArg).toContain('Hi, I have a cough');
        expect(repairArg).toContain('Return ONLY JSON');
    });

    it('retry once: invalid then invalid -> 502 with details', async () => {
        mockedProcess
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({foo: 'bar'} as any);

        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'text'});

        expect(res.status).toBe(502);
        expect(res.body.error).toBe('Invalid AI output');
        expect(typeof res.body.details).toBe('string');
        expect(res.body.details.length).toBeGreaterThan(0);
    });

    it('500 when aiService.processTranscript throws', async () => {
        mockedProcess.mockRejectedValue(new Error('LLM down'));
        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'Hello'});
        expect(res.status).toBe(500);
        expect(res.body).toEqual(
            expect.objectContaining({error: 'Processing failed'})
        );
    });

    it('env handling: missing MAX_TRANSCRIPT_LEN -> no length cap applied (documents current behavior)', async () => {
        delete process.env.MAX_TRANSCRIPT_LEN;
        mockedProcess.mockResolvedValue(validAiOutput());

        const res = await request(app)
            .post('/process-call')
            .send({transcript: 'x'.repeat(100_000)});

        expect(res.status).toBe(200);
    });

    it('router wiring: POST /process-call exists; unknown route returns 404', async () => {
        mockedProcess.mockResolvedValue(validAiOutput());
        const ok = await request(app)
            .post('/process-call')
            .send({transcript: 'valid'});
        expect(ok.status).toBe(200);

        const notFound = await request(app).get('/does-not-exist');
        expect(notFound.status).toBe(404);
        expect(notFound.body).toEqual({error: 'Not found'});
    });
});
