import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { isSkillSharer } from '../middleware/roles.middleware.js';

import {
  requestCompletion,
  checkEligibility,
  getLearnerRequests,
  getCourseRequests,
  approveCompletionRequest,
  rejectCompletionRequest,
  getMyCertificates,
  getCertificateDetails,
  verifyCertificate,
  downloadCertificatePdf,
} from '../controllers/certificate.controller.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

// POST /api/certificates/verify (Public - employers can verify)
router.post('/verify', verifyCertificate);

// GET /api/certificates/public/:certId
router.get('/public/:certId', getCertificateDetails);

// GET /api/certificates/:certId/download
router.get('/:certId/download', downloadCertificatePdf);

// ============================================================
// LEARNER ROUTES
// ============================================================
router.use(isAuthenticated);

// GET /api/certificates/check-eligibility/:courseId
router.get('/check-eligibility/:courseId', checkEligibility);

// POST /api/certificates/request/:courseId
router.post('/request/:courseId', requestCompletion);

// GET /api/certificates/my-requests
router.get('/my-requests', getLearnerRequests);

// GET /api/certificates/my-certificates
router.get('/my-certificates', getMyCertificates);

// ============================================================
// INSTRUCTOR ROUTES
// ============================================================

// GET /api/certificates/course/:courseId/requests
router.get('/course/:courseId/requests', isSkillSharer, getCourseRequests);

// POST /api/certificates/requests/:requestId/approve
router.post('/requests/:requestId/approve', isSkillSharer, approveCompletionRequest);

// POST /api/certificates/requests/:requestId/reject
router.post('/requests/:requestId/reject', isSkillSharer, rejectCompletionRequest);

export default router;
