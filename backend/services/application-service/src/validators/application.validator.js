import { z } from 'zod';

export const createApplicationSchema = z.object({}); // No body needed for draft creation

export const updateApplicationSchema = z.object({
    step: z.enum(['personal_details', 'role_selection', 'experience', 'availability']),
    data: z.record(z.any())
}).refine((val) => {
    // Step-specific validation
    if (val.step === 'role_selection') {
        if (!['nurse', 'caretaker', 'compounder'].includes(val.data.roleType)) return false;
        if (val.data.roleType === 'nurse' && !val.data.nursingLicenseNumber) return false;
    }
    if (val.step === 'personal_details') {
        if (val.data.dob) {
            const age = Math.floor((Date.now() - new Date(val.data.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            if (age < 18) return false;
        }
    }
    return true;
}, { message: 'Step validation failed' });

export const uploadFileSchema = z.object({
  documentType: z.enum(['id_proof', 'certification', 'experience_letter', 'photo']),
});

export const decisionSchema = z.object({
    decision: z.enum(['approved', 'rejected', 'more_info_requested']),
    reasonCode: z.string().optional(),
    notes: z.string().max(1000).optional()
}).refine((val) => {
    if (val.decision !== 'approved' && !val.reasonCode) return false;
    return true;
}, { message: 'reasonCode is required for non-approval decisions' });