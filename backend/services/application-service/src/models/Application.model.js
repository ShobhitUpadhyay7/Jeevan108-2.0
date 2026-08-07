import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    documentId: { type: String, required: true },
    documentType: { type: String, required: true }, // id_proof, certification, experience_letter
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    storagePath: { type: String, required: true },
    scanStatus: {
        type: String,
        enum: ['pending_scan', 'clean', 'infected'],
        default: 'pending_scan'
    },
    uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const applicationSchema = new mongoose.Schema(
    {
        applicationId: { type: String, required: true, unique: true },
        professionalUserId: { type: String, required: true, index: true },

        status: {
            type: String,
            enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'more_info_requested'],
            default: 'draft'
        },

        // Step 1: Personal Details
        personalDetails: {
            fullName: String,
            dob: Date,
            phone: String,
            address: { line1: String, city: String, pincode: String }
        },

        // Step 2: Role Selection
        roleSelection: {
            roleType: { type: String, enum: ['nurse', 'caretaker', 'compounder'] },
            nursingLicenseNumber: String // nurse only
        },

        // Step 3: Documents
        documents: [documentSchema],

        // Step 4: Experience
        experience: {
            years: Number,
            specializations: [String],
            previousEmployers: [{ name: String, duration: String }]
        },

        // Step 5: Availability
        availability: {
            preferredShiftTypes: [String],
            serviceRadiusKm: Number,
            expectedRateRange: { min: Number, max: Number, currency: String }
        },

        // Decision metadata
        decidedBy: String,
        decisionReasonCode: String,
        decisionNotes: String,

        submittedAt: Date,
        decidedAt: Date
    },
    { timestamps: true }
);

// Indexes
applicationSchema.index({ professionalUserId: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 }); // Staff queue

export const Application = mongoose.model('Application', applicationSchema);