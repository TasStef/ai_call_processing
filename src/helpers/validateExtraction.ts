import {CallExtraction} from "../models/callExtraction.model";

export function validateExtraction(data: unknown): data is CallExtraction {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d.patient === 'object' &&
        typeof d.clinical === 'object' &&
        Array.isArray((d.clinical as any).symptoms) &&
        typeof d.confidence === 'number' &&
        typeof d.recommended_action === 'object' &&
        typeof d.is_valid_call === 'boolean'
    );
}
