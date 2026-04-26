import {Urgency} from "../enums/urgency.enum";
import {Intent} from "../enums/intent.enum";

export interface CallExtraction {
    patient: { name: string | null; date_of_birth: string | null };
    clinical: { symptoms: string[]; duration: string | null; urgency: Urgency };
    intent: Intent;
    confidence: number;
    recommended_action: { type: string; mode: string };
}

