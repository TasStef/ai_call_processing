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
                date_of_birth: {type: ['string', 'null']},
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
        confidence: {type: 'number'},
        recommended_action: {
            type: 'object',
            additionalProperties: false,
            properties: {
                type: {type: 'string'},
                mode: {type: 'string'},
            },
            required: ['type', 'mode'],
        },
    },
    required: ['patient', 'clinical', 'intent', 'confidence', 'recommended_action'],
};
