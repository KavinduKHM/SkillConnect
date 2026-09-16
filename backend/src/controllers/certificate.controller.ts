import type { Request, Response } from 'express';
import { logger } from '../utils/logger.js';
import * as completionService from '../services/completion.service.js';
import * as certificateService from '../services/certificate.service.js';
import PDFDocument from 'pdfkit';
import prisma from '../config/database.js';

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

export const rejectCompletionRequest = async (req: any, res: Response): Promise<void> => {
  try {
    const instructorId = req.user.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      res.status(400).json({ error: 'Rejection reason is required.' });
      return;
    }

    const request = await certificateService.rejectCompletionRequest(instructorId, requestId, reason);
    res.status(200).json({ success: true, request });
  } catch (error: any) {
    logger.error('Error in rejectCompletionRequest:', error);
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

export const downloadCertificatePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const certId = req.params.certId;

    // Look up by primary key UUID (not certificateId code)
    const certificate = await prisma.certificate.findUnique({
      where: { id: certId },
      include: {
        course: { select: { title: true } },
        learner: { select: { name: true, email: true } },
        instructor: { select: { name: true } },
      },
    });

    if (!certificate) {
      res.status(404).json({ error: 'Certificate not found' });
      return;
    }

    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 50
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Certificate_${certificate.certificateId}.pdf`);

    doc.pipe(res);

    // Outer decorative border (double border)
    doc.lineWidth(12).strokeColor('#4F46E5').rect(15, 15, doc.page.width - 30, doc.page.height - 30).stroke();
    doc.lineWidth(2).strokeColor('#818CF8').rect(25, 25, doc.page.width - 50, doc.page.height - 50).stroke();

    // Title
    doc.moveDown(1.5);
    doc.fontSize(42).fillColor('#4F46E5').font('Helvetica-Bold').text('CERTIFICATE OF COMPLETION', { align: 'center' });
    doc.moveDown(0.5);

    // Decorative divider
    const midX = doc.page.width / 2;
    doc.lineWidth(1).strokeColor('#C7D2FE').moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke();
    doc.moveDown(0.8);

    doc.fontSize(18).fillColor('#6B7280').font('Helvetica').text('This is to certify that', { align: 'center' });
    doc.moveDown(0.6);

    // Learner name
    const learnerName = certificate.learner?.name || (certificate.learner as any)?.email || 'Learner';
    doc.fontSize(34).fillColor('#111827').font('Helvetica-Bold').text(learnerName, { align: 'center', underline: true });
    doc.moveDown(0.6);

    doc.fontSize(18).fillColor('#6B7280').font('Helvetica').text('has successfully completed the course', { align: 'center' });
    doc.moveDown(0.4);

    // Course name
    const courseName = certificate.course?.title || 'Course';
    doc.fontSize(26).fillColor('#4F46E5').font('Helvetica-Bold').text(courseName, { align: 'center' });
    doc.moveDown(0.5);

    // Divider
    doc.lineWidth(1).strokeColor('#C7D2FE').moveTo(100, doc.y).lineTo(doc.page.width - 100, doc.y).stroke();
    doc.moveDown(1);

    // Bottom details row
    const issueDate = new Date(certificate.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const bottomY = doc.page.height - 120;
    const colW = (doc.page.width - 100) / 3;

    doc.fontSize(12).fillColor('#9CA3AF').font('Helvetica').text('DATE OF ISSUE', 50, bottomY, { width: colW, align: 'center' });
    doc.fontSize(12).fillColor('#9CA3AF').font('Helvetica').text('INSTRUCTOR', 50 + colW, bottomY, { width: colW, align: 'center' });
    doc.fontSize(12).fillColor('#9CA3AF').font('Helvetica').text('CERTIFICATE ID', 50 + colW * 2, bottomY, { width: colW, align: 'center' });

    doc.fontSize(14).fillColor('#111827').font('Helvetica-Bold').text(issueDate, 50, bottomY + 18, { width: colW, align: 'center' });
    doc.fontSize(14).fillColor('#111827').font('Helvetica-Bold').text(certificate.instructor?.name || 'Instructor', 50 + colW, bottomY + 18, { width: colW, align: 'center' });
    doc.fontSize(14).fillColor('#111827').font('Helvetica-Bold').text(certificate.certificateId, 50 + colW * 2, bottomY + 18, { width: colW, align: 'center' });

    // Footer
    doc.fontSize(9).fillColor('#D1D5DB').font('Helvetica').text(
      `Verify this certificate at: skillconnect.com/verify/${certificate.verificationCode}`,
      0, doc.page.height - 40, { align: 'center' }
    );

    doc.end();
  } catch (error: any) {
    logger.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
