import Anthropic from '@anthropic-ai/sdk';
import {processTranscriptPrompt} from "../prompts/processTranscript.prompt";
import {callExtractionSchema} from "../models/callExtraction.schema";

class AIService {
    private client: Anthropic;

    constructor() {
        const apiKey = process.env.AI_API_KEY;
        if (!apiKey) {
            throw new Error('AI_API_KEY environment variable is not set');
        }

        this.client = new Anthropic({
            apiKey: apiKey,
        });
    }

    async processTranscript(transcript: string): Promise<any> {
        const message = await this.client.messages.create({
            max_tokens: 254,
            model: 'claude-opus-4-5',
            system: processTranscriptPrompt,
            messages: [{role: 'user', content: transcript}],
            output_config: {
                format: {
                    type: 'json_schema',
                    schema: callExtractionSchema,
                },
            }
        });

        const content = message.content[0];
        if (content.type === 'text') {
            let jsonText = content.text.trim();

            return JSON.parse(jsonText);
        }

        throw new Error('Unexpected response format from AI');
    }
}

export const aiService = new AIService();
export {AIService};
