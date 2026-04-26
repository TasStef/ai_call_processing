import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const client = axios.create({ baseURL: BASE_URL });

describe('POST /process-call', () => {
    jest.setTimeout(30000);

    it('handles a normal transcript', async () => {
        const { data, status } = await client.post('/process-call', {
            transcript: "Hi, I've had a bad cough for 5 days. My name is John Smith, DOB 2nd Jan 1990. I'd like to see a doctor.",
        });
        expect(status).toBe(200);
        expect(data.patient.name).toBe('John Smith');
        expect(data.clinical.symptoms.some((s: string) => s.includes('cough'))).toBe(true);
    });

    it('handles missing info', async () => {
        const { data } = await client.post('/process-call', {
            transcript: "I feel unwell and want an appointment.",
        });
        expect(data.patient.name).toBeNull();
        expect(data.patient.date_of_birth).toBeNull();
    });

    it('handles multiple intents', async () => {
        const { data } = await client.post('/process-call', {
            transcript: "I need to book an appointment and also get a repeat prescription.",
        });
        expect(typeof data.intent).toBe('string');
        expect(data.intent.length).toBeGreaterThan(0);
    });

    it('rejects irrelevant input', async () => {
        const { status } = await client.post('/process-call', {
            transcript: "Hello? Is this the pizza place?",
        }, { validateStatus: () => true });
        expect(status).toBe(400);
    });

    it('rejects empty transcript', async () => {
        const { status } = await client.post('/process-call', {
            transcript: "",
        }, { validateStatus: () => true });
        expect(status).toBe(400);
    });
});
