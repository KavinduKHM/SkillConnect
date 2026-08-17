import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import * as completionService from '../services/completion.service.js';
import * as certificateService from '../services/certificate.service.js';

// -------------------------------------------------------------
// COMPLETION REQUESTS
// -------------------------------------------------------------

export const requestCompletion = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const { courseId } = req.params;
    const request = await completionService.requestCourseCompletion(learnerId, courseId);
    res.status(201).json({ success: true, request });
  } catch (error: any) {
    logger.error('Error in requestCompletion controller:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getLearnerRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const requests = await completionService.getLearnerCompletionRequests(learnerId);
    res.status(200).json({ success: true, requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCourseRequests = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const { courseId } = req.params;
    const requests = await completionService.getCourseCompletionRequests(instructorId, courseId);
    res.status(200).json({ success: true, requests });
  } catch (error: any) {
    res.status(403).json({ error: error.message });
  }
};

// -------------------------------------------------------------
// CERTIFICATES
// -------------------------------------------------------------

export const approveCompletionRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const { requestId } = req.params;
    const certificate = await certificateService.approveCompletionAndIssueCertificate(instructorId, requestId);
    res.status(201).json({ success: true, certificate });
  } catch (error: any) {
    logger.error('Error in approveCompletionRequest:', error);
    res.status(400).json({ error: error.message });
  }
};

export const getMyCertificates = async (req: any, res: Response): Promise<void> => {
  try {
    const learnerId = req.user.id;
    const certificates = await certificateService.getLearnerCertificates(learnerId);
    res.status(200).json({ success: true, certificates });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCertificateDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const certId = req.params.certId as string; // The public ID (e.g. CERT-XXXXXX)
    const certificate = await certificateService.getCertificateByCode(certId);
    res.status(200).json({ success: true, certificate });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }
    
    const ipAddress = (req.ip || req.socket.remoteAddress) as string | undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;
    
    const result = await certificateService.verifyCertificate(code, ipAddress, userAgent);
    res.status(result.valid ? 200 : 400).json({ success: result.valid, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
