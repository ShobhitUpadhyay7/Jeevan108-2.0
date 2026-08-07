import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { Application } from '../models/Application.model.js';
import { saveFile } from '../config/storage.js';
import { publishEvent } from '../config/rabbitmq.js';
import { ApiError } from '../utils/ApiError.js';
import { updateApplicationSchema, decisionSchema } from '../validators/application.validator.js';

// Multer config: memory storage (we write manually after validation)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new ApiError(415, 'UNSUPPORTED_FILE_TYPE', 'Only PDF, JPEG, PNG allowed'));
  }
});

export const uploadMiddleware = upload.single('file');

// POST /api/v1/applications — Create draft
export const createApplication = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) throw new ApiError(401, 'UNAUTHENTICATED', 'User context missing');

    const applicationId = `app_${uuidv4().slice(0, 8)}`;
    const application = await Application.create({
      applicationId,
      professionalUserId: userId,
      status: 'draft'
    });

    res.status(201).json({
      data: { applicationId: application.applicationId, status: 'draft' },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// PATCH /api/v1/applications/:applicationId — Autosave step
export const updateApplication = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { applicationId } = req.params;

    const parsed = updateApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid step data', parsed.error.flatten());
    }

    const application = await Application.findOne({ applicationId, professionalUserId: userId });
    if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');
    if (application.status !== 'draft') {
      throw new ApiError(409, 'INVALID_STATE', 'Can only edit draft applications');
    }

    if (parsed.data.step === 'personal_details' && parsed.data.data.dob) {
      const age = Math.floor((Date.now() - new Date(parsed.data.data.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) throw new ApiError(422, 'ELIGIBILITY_AGE_FAILED', 'Applicant must be at least 18 years old');
    }

    const stepFieldMap = {
      personal_details: 'personalDetails',
      role_selection: 'roleSelection',
      experience: 'experience',
      availability: 'availability'
    };

    application[stepFieldMap[parsed.data.step]] = parsed.data.data;
    await application.save();

    res.status(200).json({
      data: { applicationId: application.applicationId, step: parsed.data.step, saved: true },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// POST /api/v1/applications/:applicationId/documents/upload
// Content-Type: multipart/form-data
// Fields: file (binary), documentType (string)
export const uploadDocument = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { applicationId } = req.params;

    if (!req.file) throw new ApiError(400, 'VALIDATION_ERROR', 'File is required');

    const documentType = req.body.documentType;
    if (!['id_proof', 'certification', 'experience_letter', 'photo'].includes(documentType)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid documentType');
    }

    const application = await Application.findOne({ applicationId, professionalUserId: userId });
    if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');
    if (application.status !== 'draft') {
      throw new ApiError(409, 'INVALID_STATE', 'Can only upload to draft applications');
    }

    const documentId = `doc_${uuidv4().slice(0, 8)}`;
    const fileName = req.file.originalname;
    const storagePath = `${applicationId}/${documentType}/${documentId}_${fileName}`;

    // Save file to local disk
    await saveFile(req.file.buffer, storagePath);

    application.documents.push({
      documentId,
      documentType,
      fileName,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storagePath,
      scanStatus: 'clean' // Skip virus scan for local MVP
    });
    await application.save();

    res.status(201).json({
      data: { documentId, fileName, sizeBytes: req.file.size, status: 'uploaded' },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// POST /api/v1/applications/:applicationId/submit
export const submitApplication = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const { applicationId } = req.params;

    const application = await Application.findOne({ applicationId, professionalUserId: userId });
    if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');
    if (application.status !== 'draft') {
      throw new ApiError(409, 'INVALID_STATE', 'Application already submitted');
    }

    const missingFields = [];
    if (!application.personalDetails?.fullName) missingFields.push('personalDetails.fullName');
    if (!application.roleSelection?.roleType) missingFields.push('roleSelection.roleType');
    if (application.documents.length === 0) missingFields.push('documents');

    if (missingFields.length > 0) {
      throw new ApiError(422, 'APPLICATION_INCOMPLETE', 'Application is incomplete', { missingFields });
    }

    application.status = 'submitted';
    application.submittedAt = new Date();
    await application.save();

    await publishEvent('application.submitted', {
      applicationId: application.applicationId,
      professionalUserId: userId,
      roleType: application.roleSelection.roleType
    });

    res.status(200).json({
      data: { applicationId: application.applicationId, status: 'submitted' },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// GET /api/v1/applications/:applicationId
export const getApplication = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { applicationId } = req.params;

    const query = { applicationId };
    if (userRole !== 'staff' && userRole !== 'admin') {
      query.professionalUserId = userId;
    }

    const application = await Application.findOne(query);
    if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');

    res.status(200).json({
      data: application,
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};

// POST /api/v1/applications/:applicationId/decision
export const makeDecision = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const { applicationId } = req.params;

    if (userRole !== 'staff' && userRole !== 'admin') {
      throw new ApiError(403, 'FORBIDDEN', 'Only staff/admin can make decisions');
    }

    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid decision', parsed.error.flatten());
    }

    const application = await Application.findOne({ applicationId });
    if (!application) throw new ApiError(404, 'NOT_FOUND', 'Application not found');
    if (!['submitted', 'under_review', 'more_info_requested'].includes(application.status)) {
      throw new ApiError(409, 'INVALID_STATE', `Cannot decide on application in ${application.status} state`);
    }

    const oldStatus = application.status;
    application.status = parsed.data.decision === 'approved' ? 'approved' : parsed.data.decision;
    application.decidedBy = userId;
    application.decisionReasonCode = parsed.data.reasonCode || null;
    application.decisionNotes = parsed.data.notes || null;
    application.decidedAt = new Date();
    await application.save();

    await publishEvent('application.status_changed', {
      applicationId: application.applicationId,
      professionalUserId: application.professionalUserId,
      oldStatus,
      newStatus: application.status,
      decidedBy: userId,
      reasonCode: parsed.data.reasonCode || null,
      // Include data for Professional Service to build profile
      roleType: application.roleSelection?.roleType,
      fullName: application.personalDetails?.fullName,
      yearsExperience: application.experience?.years,
      specializations: application.experience?.specializations || []
    });

    res.status(200).json({
      data: { applicationId: application.applicationId, status: application.status },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) { next(error); }
};