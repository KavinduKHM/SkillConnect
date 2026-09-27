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
    const certId = req.params.certId as string; // The public ID (e.g. CERT-XXXXXX or UUID)
    const certificate = await certificateService.getCertificateByCode(certId);

    // If client is a browser expecting HTML, redirect to full verification page
    if (req.accepts('html') && !req.query.format) {
      res.redirect(`/api/certificates/verify/${certificate.verificationCode || certId}`);
      return;
    }

    res.status(200).json({ success: true, certificate });
  } catch (error: any) {
    if (req.accepts('html') && !req.query.format) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Certificate Not Found - SkillConnect</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF2EB; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #FFFDF9; border: 1px solid #EADBCE; border-radius: 24px; padding: 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(43,33,30,0.08); }
            .icon { font-size: 48px; margin-bottom: 16px; }
            h1 { color: #BA1A1A; font-size: 22px; margin: 0 0 10px; font-weight: 800; }
            p { color: #7A6B65; font-size: 14px; line-height: 1.6; margin: 0; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⚠️</div>
            <h1>Certificate Not Found</h1>
            <p>${error.message || 'No certificate matching this identifier was found.'}</p>
          </div>
        </body>
        </html>
      `);
      return;
    }
    res.status(404).json({ error: error.message });
  }
};

export const verifyCertificate = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = (req.params?.code || req.body?.code || req.query?.code) as string | undefined;
    if (!code) {
      res.status(400).json({ error: 'Verification code is required' });
      return;
    }
    
    const ipAddress = (req.ip || req.socket.remoteAddress) as string | undefined;
    const userAgent = req.headers['user-agent'] as string | undefined;
    
    const result = await certificateService.verifyCertificate(code, ipAddress, userAgent);

    // If client accepts HTML (browser direct navigation), render beautiful verification page
    if (req.accepts('html') && !req.query.format) {
      const cert = result.certificate;
      if (!result.valid || !cert) {
        res.status(404).send(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Certificate Verification - SkillConnect</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF2EB; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
              .card { background: #FFFDF9; border: 1px solid #EADBCE; border-radius: 24px; padding: 36px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(43,33,30,0.08); }
              .icon { font-size: 48px; margin-bottom: 16px; }
              h1 { color: #BA1A1A; font-size: 22px; margin: 0 0 10px; font-weight: 800; }
              p { color: #7A6B65; font-size: 14px; line-height: 1.6; margin: 0; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">⚠️</div>
              <h1>Verification Failed</h1>
              <p>${result.message || 'This certificate verification code is invalid or has expired.'}</p>
            </div>
          </body>
          </html>
        `);
        return;
      }

      const issueDate = cert.issueDate ? new Date(cert.issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
      const learnerName = cert.learner?.name || cert.learner?.email || 'Learner';
      const courseTitle = cert.course?.title || 'Course';
      const instructorName = cert.instructor?.name || 'Verified Skill Sharer';

      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verified Certificate - SkillConnect</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #FAF2EB; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #FFFDF9; border: 1px solid #EADBCE; border-radius: 24px; padding: 40px; max-width: 520px; width: 100%; box-shadow: 0 4px 24px rgba(43,33,30,0.08); }
            .badge-row { display: flex; align-items: center; justify-content: center; gap: 8px; background: #DCFCE7; color: #15803D; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 800; width: fit-content; margin: 0 auto 20px; }
            h1 { color: #2B211E; font-size: 24px; font-weight: 800; margin: 0 0 8px; text-align: center; }
            .sub { color: #7A6B65; font-size: 13px; text-align: center; margin: 0 0 24px; }
            .details { background: #F3ECE2; border-radius: 16px; padding: 20px; border: 1px solid #EADBCE; margin-bottom: 24px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
            .row:last-child { margin-bottom: 0; }
            .label { color: #7A6B65; font-weight: 600; }
            .val { color: #2B211E; font-weight: 800; text-align: right; }
            .val.primary { color: #D95D39; }
            .footer-info { text-align: center; font-size: 11px; color: #A0938E; }
            .download-btn { display: block; background: #8B331A; color: #FFF; text-decoration: none; text-align: center; padding: 12px 20px; border-radius: 20px; font-weight: 800; font-size: 14px; margin-top: 20px; }
            .download-btn:hover { background: #A43716; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge-row">✓ OFFICIAL VERIFIED CERTIFICATE</div>
            <h1>Certificate of Completion</h1>
            <p class="sub">This credential has been verified authentic by SkillConnect verification system.</p>
            
            <div class="details">
              <div class="row">
                <span class="label">Recipient:</span>
                <span class="val">${learnerName}</span>
              </div>
              <div class="row">
                <span class="label">Course Completed:</span>
                <span class="val primary">${courseTitle}</span>
              </div>
              <div class="row">
                <span class="label">Instructor:</span>
                <span class="val">${instructorName}</span>
              </div>
              <div class="row">
                <span class="label">Date of Issue:</span>
                <span class="val">${issueDate}</span>
              </div>
              <div class="row">
                <span class="label">Certificate ID:</span>
                <span class="val">${cert.certificateId}</span>
              </div>
              <div class="row">
                <span class="label">Verification Code:</span>
                <span class="val" style="font-family: monospace; font-size: 11px;">${cert.verificationCode}</span>
              </div>
            </div>

            <div class="footer-info">
              Verified ${cert.verificationCount || 1} time(s) • SkillConnect Platform
            </div>

            <a class="download-btn" href="/api/certificates/${cert.id}/download" target="_blank">Download Certificate PDF 📜</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    res.status(result.valid ? 200 : 400).json({ success: result.valid, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const downloadCertificatePdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const certId = req.params.certId as string;
    if (!certId) {
      res.status(400).json({ error: 'Certificate ID is required' });
      return;
    }

    // Look up by primary key UUID, certificateId, or verificationCode
    const certificate: any = await prisma.certificate.findFirst({
      where: {
        OR: [
          { id: certId },
          { certificateId: certId },
          { verificationCode: certId },
        ],
      },
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

    // Footer - Localhost Verification Link
    const verificationUrl = `http://localhost:5000/api/certificates/verify/${certificate.verificationCode}`;
    doc.fontSize(9).fillColor('#6B7280').font('Helvetica').text(
      `Verify this certificate at: ${verificationUrl}`,
      0, doc.page.height - 40, { align: 'center', link: verificationUrl }
    );

    doc.end();
  } catch (error: any) {
    logger.error('Error generating PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  }
};
