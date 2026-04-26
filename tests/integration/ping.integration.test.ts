import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const client = axios.create({baseURL: BASE_URL});

describe("ping controller", () => {
    test("returns 200 and {status: 'ok'}", async () => {
        // Arrange
        const res = await client.get('/ping')

        // Assert
        expect(res.status).toBe(200);
        expect(res.data).toEqual({ status: 'ok' });
    });
});
