import 'dotenv/config';
import express, {Request, Response, NextFunction} from 'express';
import {pingRouter} from "./routes/ping/ping.router";
import {processCallRouter} from "./routes/processCall/processCall.router";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

// Routes
app.use('/ping', pingRouter)
app.use('/process-call', processCallRouter)

// Not Found
app.use((_req: Request, res: Response) => {
    res.status(404).json({error: 'Not found'});
});

// Server Error
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({error: 'Internal server error'});
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


