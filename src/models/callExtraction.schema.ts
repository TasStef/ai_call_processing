import {Urgency} from "../enums/urgency.enum";
import {Intent} from "../enums/intent.enum";

export const callExtractionSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        patient: {
            type: 'object',
            additionalProperties: false,
            properties: {
                name: {type: ['string', 'null']},
                date_of_birth: {
                    anyOf: [
                        {type: 'null'},
                        {type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$'}
                    ]
                },
            },
            required: ['name', 'date_of_birth'],
        },
        clinical: {
            type: 'object',
            additionalProperties: false,
            properties: {
                symptoms: {type: 'array', items: {type: 'string'}},
                duration: {type: ['string', 'null']},
                urgency: {type: 'string', enum: Object.values(Urgency)},
            },
            required: ['symptoms', 'duration', 'urgency'],
        },
        intent: {
            type: 'string',
            enum: Object.values(Intent),
        },
        confidence: {type: 'number', minimum: 0, maximum: 1},
        recommended_action: {
            type: 'object',
            additionalProperties: false,
            properties: {
                type: {type: 'string'},
                mode: {type: 'string'},
            },
            required: ['type', 'mode'],
        },
        is_valid_call: {type: 'boolean'},
    },
    required: ['patient', 'clinical', 'intent', 'confidence', 'recommended_action'],
};
