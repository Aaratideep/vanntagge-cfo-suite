'use client';

import React, { useState } from 'react';
import { useDashboardStore } from '../../store/dashboardStore';
import {
  Video,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  FileText,
  Download,
  Sparkles,
  Building,
  Play,
  Link as LinkIcon,
  AlertOctagon,
  HelpCircle,
  FileCheck,
  Check,
} from 'lucide-react';

export const StartupIndia80IacView: React.FC = () => {
  const { clients, currentUser, setGlobalSuccessMsg } = useDashboardStore();

  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || 'client-1');

  // Form 80-IAC Application States
  const [dpiitNumber, setDpiitNumber] = useState('DIPP104829');
  const [incDate, setIncDate] = useState('2021-06-15');
  const [entityType, setEntityType] = useState<'PVT_LTD' | 'LLP' | 'PARTNERSHIP'>('PVT_LTD');
  const [maxTurnoverCr, setMaxTurnoverCr] = useState<number>(4.65);
  const [isOriginalBusiness, setIsOriginalBusiness] = useState(true);
  const [selectedTaxHolidayBlock, setSelectedTaxHolidayBlock] = useState('FY 2025-26 to FY 2027-28');

  // Video Pitch State (Official Guidelines: 2–3 mins ideal, max 5 mins)
  const [videoUrl, setVideoUrl] = useState('https://youtu.be/dQw4w9WgXcQ');
  const [videoPlatform, setVideoPlatform] = useState<'YOUTUBE' | 'GOOGLE_DRIVE' | 'VIMEO' | 'OTHER'>('YOUTUBE');
  const [videoMinutes, setVideoMinutes] = useState<number>(2);
  const [videoSeconds, setVideoSeconds] = useState<number>(45);

  // 6-Point Official IMB Video Checklist
  const [videoChecklist, setVideoChecklist] = useState({
    liveProductDemo: true, // Walkthrough/prototype of software or client tech
    noSlideOnly: true, // NOT only slides with voiceover (strict rejection rule)
    noScriptOnly: true, // NOT founder reading script without product/facility
    marketTraction: true, // Customer reviews, testimonials, user adoption
    publicSharing: true, // Unrestricted link ("Anyone with link can view" / Unlisted)
    pitchDeckAligned: true, // Pitch deck PDF <= 5MB matches video metrics
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const totalSeconds = videoMinutes * 60 + videoSeconds;

  // Duration Evaluation according to official guidelines
  const getDurationStatus = () => {
    if (totalSeconds < 60) {
      return {
        status: 'WARNING',
        label: 'Too Brief (< 1 min)',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        msg: 'Video may be too short to adequately demonstrate the working model, innovation, and customer traction.',
      };
    }
    if (totalSeconds <= 180) {
      return {
        status: 'OPTIMAL',
        label: 'Optimal Duration (2–3 mins)',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        msg: 'Complies perfectly with Startup India IMB recommended length (2–3 minutes). Concise and high-impact.',
      };
    }
    if (totalSeconds <= 300) {
      return {
        status: 'ACCEPTABLE',
        label: 'Acceptable (Within 5-min Cap)',
        color: 'text-blue-700 bg-blue-50 border-blue-200',
        msg: 'Acceptable length. Ensure product walkthrough is emphasized and pacing is crisp.',
      };
    }
    return {
      status: 'REJECTED',
      label: 'Strict Rejection (> 5 mins)',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
      msg: 'CRITICAL: Exceeds the 5-minute maximum limit specified in Form 80-IAC guidelines. IMB will reject.',
    };
  };

  const durationEval = getDurationStatus();

  // Statutory 80-IAC Eligibility Evaluation
  const isIncDateEligible = new Date(incDate) >= new Date('2016-04-01');
  const isEntityTypeEligible = entityType === 'PVT_LTD' || entityType === 'LLP';
  const isTurnoverEligible = maxTurnoverCr <= 100;
  const isDpiitEligible = Boolean(dpiitNumber && dpiitNumber.trim().length >= 6);

  const isStatutoryEligible =
    isIncDateEligible && isEntityTypeEligible && isTurnoverEligible && isDpiitEligible && isOriginalBusiness;

  const allVideoChecksPass =
    Object.values(videoChecklist).every(Boolean) && totalSeconds >= 60 && totalSeconds <= 300;

  const overallReadinessPct = Math.round(
    ((Number(isStatutoryEligible) * 40) +
      (Object.values(videoChecklist).filter(Boolean).length / 6) * 40 +
      (durationEval.status === 'OPTIMAL' ? 20 : durationEval.status === 'ACCEPTABLE' ? 15 : 0))
  );

  const toggleCheck = (key: keyof typeof videoChecklist) => {
    setVideoChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport80IacDossier = () => {
    const lines = [
      `========================================================================`,
      `    STARTUP INDIA SECTION 80-IAC TAX HOLIDAY APPLICATION DOSSIER`,
      `               Inter-Ministerial Board (IMB) Submission Packet`,
      `========================================================================`,
      `Client Name          : ${selectedClient?.companyName || 'Startup'}`,
      `DPIIT Recognition    : ${dpiitNumber}`,
      `Incorporation Date   : ${incDate}`,
      `Entity Structure     : ${entityType === 'PVT_LTD' ? 'Private Limited Company' : entityType}`,
      `Peak Turnover        : ₹${maxTurnoverCr} Crores (Cap: ₹100 Cr)`,
      `Tax Holiday Block    : 3 Consecutive Years (${selectedTaxHolidayBlock})`,
      `Original Business    : ${isOriginalBusiness ? 'Verified (No splitting/reconstruction)' : 'Flagged'}`,
      `------------------------------------------------------------------------`,
      `OFFICIAL VIDEO LINK ASSESSMENT (As per 80-IAC Guidelines)`,
      `------------------------------------------------------------------------`,
      `Video URL            : ${videoUrl}`,
      `Hosting Platform     : ${videoPlatform}`,
      `Video Duration       : ${videoMinutes}m ${videoSeconds}s (Total: ${totalSeconds} seconds)`,
      `Duration Compliance  : ${durationEval.label}`,
      ``,
      `IMB COMPLIANCE CRITERIA:`,
      `1. Live Product/PoC Demonstration  : ${videoChecklist.liveProductDemo ? 'COMPLIANT' : 'MISSING'}`,
      `2. No Slide-Only Presentations     : ${videoChecklist.noSlideOnly ? 'COMPLIANT (No slide voiceover)' : 'RISK OF REJECTION'}`,
      `3. No Script-Reading Only          : ${videoChecklist.noScriptOnly ? 'COMPLIANT (Shows product/tech)' : 'RISK OF REJECTION'}`,
      `4. Customer Validation/Reviews     : ${videoChecklist.marketTraction ? 'COMPLIANT (Customer proof shown)' : 'MISSING'}`,
      `5. Unrestricted Cloud Access       : ${videoChecklist.publicSharing ? 'COMPLIANT (Anyone with link)' : 'RESTRICTED'}`,
      `6. Pitch Deck PDF (<= 5MB)         : ${videoChecklist.pitchDeckAligned ? 'COMPLIANT (Metrics synchronized)' : 'PENDING'}`,
      `------------------------------------------------------------------------`,
      `OVERALL IMB APPROVAL READINESS     : ${overallReadinessPct}%`,
      `VCFO Certification Status          : ${overallReadinessPct >= 85 ? 'APPROVED FOR IMB SUBMISSION' : 'REVISION REQUIRED'}`,
      `========================================================================`,
      `Compiled via VANNTAGE CFO Suite — Virtual CFO Statutory Advisory Desk`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `80-IAC-Application-Dossier-${selectedClient?.companyName?.replace(/\s+/g, '-') || 'startup'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setGlobalSuccessMsg('Section 80-IAC Application & Video Link Dossier exported successfully.');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Official Guidelines Callout Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-orange-500 text-white shadow-xs">
              Startup India 🇮🇳
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300">
              Section 80-IAC Income Tax Act
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight font-outfit text-white">
            Section 80-IAC Tax Exemption & Pitch Video Link Audit
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            DPIIT recognized eligible startups can obtain a <strong>100% tax holiday on profits for 3 consecutive financial years</strong>.
            The Inter-Ministerial Board (IMB) mandates a strict pitch video link adhering to the official Form 80-IAC Video Link Guidelines.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <a
            href="https://www.startupindia.gov.in/content/dam/invest-india/Form80IAC_Video-Link-Guidelines.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <ExternalLink size={14} /> Official Guidelines PDF
          </a>
          <button
            onClick={handleExport80IacDossier}
            className="px-4 py-2.5 bg-primary hover:bg-primary-container text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
          >
            <Download size={14} /> Export 80-IAC Dossier
          </button>
        </div>
      </div>

      {/* Client Selector & Readiness Scoreboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Client Picker */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Applicant Startup</span>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-primary transition-all cursor-pointer"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>
          <span className="text-[10px] text-slate-400 font-medium">Industry: SaaS / Tech Startup</span>
        </div>

        {/* Readiness Meter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
            <span className="text-slate-500">IMB Readiness Score</span>
            <span className={`font-mono text-sm ${overallReadinessPct >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {overallReadinessPct}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                overallReadinessPct >= 80 ? 'bg-emerald-500' : overallReadinessPct >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${overallReadinessPct}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-500 block">
            {overallReadinessPct >= 80 ? 'Ready for IMB submission' : 'Complete video & statutory checks below'}
          </span>
        </div>

        {/* Tax Holiday Value */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tax Holiday Benefit</span>
          <div className="text-base font-black text-slate-900 font-outfit">100% Tax Exemption</div>
          <p className="text-[10px] text-emerald-700 font-semibold">3 Consecutive Financial Years</p>
        </div>

        {/* Statutory Eligibility Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Statutory Eligibility</span>
          <div className="flex items-center gap-1.5 mt-1">
            {isStatutoryEligible ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 size={13} /> Eligible
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                <AlertTriangle size={13} /> Non-Compliant
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">DPIIT &amp; Companies Act criteria</p>
        </div>
      </div>

      {/* Main Grid: Video Pitch Audit (Left) & Statutory Criteria (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Official Video Link & Pitch Evaluation (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                <Video size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-outfit">
                  Form 80-IAC Pitch Video Link Verification
                </h3>
                <p className="text-[11px] text-slate-500">
                  Strictly evaluated by the Inter-Ministerial Board (IMB)
                </p>
              </div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${durationEval.color}`}>
              {durationEval.label}
            </span>
          </div>

          {/* Video Link Input Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Public / Unrestricted Video URL *</span>
                <span className="text-[10px] text-slate-400 font-normal">YouTube Unlisted or Public Drive</span>
              </label>
              <div className="relative">
                <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-primary focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hosting Platform</label>
                <select
                  value={videoPlatform}
                  onChange={(e) => setVideoPlatform(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 outline-none"
                >
                  <option value="YOUTUBE">YouTube (Recommended - Unlisted)</option>
                  <option value="GOOGLE_DRIVE">Google Drive (Unrestricted Sharing)</option>
                  <option value="VIMEO">Vimeo</option>
                  <option value="OTHER">Other Cloud Storage</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex justify-between">
                  <span>Video Duration *</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {videoMinutes}m {videoSeconds}s ({totalSeconds}s)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={videoMinutes}
                    onChange={(e) => setVideoMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-center font-bold"
                    placeholder="Minutes"
                  />
                  <span className="text-xs text-slate-400 font-bold">:</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={videoSeconds}
                    onChange={(e) => setVideoSeconds(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-1/2 bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-center font-bold"
                    placeholder="Seconds"
                  />
                </div>
              </div>
            </div>

            {/* Duration Advice Alert Box */}
            <div className={`p-3 rounded-xl border text-xs leading-relaxed ${durationEval.color}`}>
              <strong>Rule: 2–3 minutes ideal, maximum 5 minutes.</strong>
              <p className="mt-0.5">{durationEval.msg}</p>
            </div>
          </div>

          {/* 6-Point Official IMB Rejection & Approval Checklist */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Official IMB Video Checklist</span>
              <span className="text-[10px] font-semibold text-slate-500">
                {Object.values(videoChecklist).filter(Boolean).length}/6 Compliant
              </span>
            </h4>

            <div className="space-y-2">
              {[
                {
                  key: 'liveProductDemo' as const,
                  title: 'Working Model / Prototype Demonstration Included',
                  desc: 'Mandatory. Live screen recording of software, product prototype walkthrough, or tech built for clients.',
                  isStrictRule: true,
                },
                {
                  key: 'noSlideOnly' as const,
                  title: 'Avoided Slide-Only Presentations',
                  desc: 'STRICT REJECTION CRITERIA: Videos created solely using pitch deck slides with voiceover are immediately rejected.',
                  isStrictRule: true,
                },
                {
                  key: 'noScriptOnly' as const,
                  title: 'Avoided Script-Reading Headshot Only',
                  desc: 'STRICT REJECTION CRITERIA: Founder merely reading a speech without showcasing the product/facility is rejected.',
                  isStrictRule: true,
                },
                {
                  key: 'marketTraction' as const,
                  title: 'Customer Feedback & Market Traction Featured',
                  desc: 'Visually shows customer reviews, client testimonials, adoption traction, or user feedback.',
                  isStrictRule: false,
                },
                {
                  key: 'publicSharing' as const,
                  title: 'Unrestricted Public Access Permission',
                  desc: 'If hosted on Google Drive, set to "Anyone with the link can view". If YouTube, set to "Unlisted" or "Public".',
                  isStrictRule: true,
                },
                {
                  key: 'pitchDeckAligned' as const,
                  title: 'Pitch Deck PDF (Max 5MB) Synchronized',
                  desc: 'Pitch deck PDF uploaded to portal matches video traction, revenue model, team, and shareholding pattern.',
                  isStrictRule: false,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={() => toggleCheck(item.key)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    videoChecklist[item.key]
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      videoChecklist[item.key]
                        ? 'bg-emerald-600 text-white'
                        : 'border border-slate-300 bg-white'
                    }`}
                  >
                    {videoChecklist[item.key] && <Check size={13} strokeWidth={3} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{item.title}</span>
                      {item.isStrictRule && (
                        <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          IMB Rule
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Section 80-IAC Statutory Qualifications (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-outfit">
                  Statutory 80-IAC Eligibility Checks
                </h3>
                <p className="text-[11px] text-slate-500">Ministry of Finance &amp; DPIIT Rules</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* DPIIT Number */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">DPIIT Recognition Number *</label>
                <input
                  type="text"
                  value={dpiitNumber}
                  onChange={(e) => setDpiitNumber(e.target.value)}
                  placeholder="e.g. DIPP104829"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono font-bold text-slate-800 uppercase"
                />
              </div>

              {/* Entity Type */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Corporate Entity Structure *</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                >
                  <option value="PVT_LTD">Private Limited Company (Eligible)</option>
                  <option value="LLP">Limited Liability Partnership / LLP (Eligible)</option>
                  <option value="PARTNERSHIP">Partnership / Proprietorship (Not Eligible)</option>
                </select>
                {!isEntityTypeEligible && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">
                    Section 80-IAC is restricted strictly to Private Limited Companies and LLPs.
                  </p>
                )}
              </div>

              {/* Incorporation Date */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Date of Incorporation *</label>
                <input
                  type="date"
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                />
                {!isIncDateEligible && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">
                    Must be incorporated on or after 1st April 2016.
                  </p>
                )}
              </div>

              {/* Peak Turnover */}
              <div>
                <label className="block text-slate-600 font-bold mb-1 flex justify-between">
                  <span>Peak Annual Turnover (₹ Crores) *</span>
                  <span className="text-[10px] text-slate-400">Max limit: ₹100 Cr</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  value={maxTurnoverCr}
                  onChange={(e) => setMaxTurnoverCr(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800"
                />
                {!isTurnoverEligible && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">
                    Turnover has exceeded ₹100 Crores threshold in a previous financial year.
                  </p>
                )}
              </div>

              {/* Original Business */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isOriginalBusiness}
                    onChange={(e) => setIsOriginalBusiness(e.target.checked)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <span className="font-bold text-slate-800 text-xs">
                    Original Business (Not formed by reconstruction/split)
                  </span>
                </label>
                <p className="text-[10px] text-slate-500 mt-1 pl-6">
                  Startup must not be formed by splitting up, reconstruction, or amalgamation of an existing business.
                </p>
              </div>

              {/* 3-Year Tax Holiday Block */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">
                  Selected 3-Year Tax Holiday Block (100% Tax Exemption)
                </label>
                <select
                  value={selectedTaxHolidayBlock}
                  onChange={(e) => setSelectedTaxHolidayBlock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
                >
                  <option value="FY 2024-25 to FY 2026-27">FY 2024-25 to FY 2026-27 (Immediate)</option>
                  <option value="FY 2025-26 to FY 2027-28">FY 2025-26 to FY 2027-28 (Recommended)</option>
                  <option value="FY 2026-27 to FY 2028-29">FY 2026-27 to FY 2028-29 (Future Growth)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Submission Checklist */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 space-y-2">
            <h4 className="font-bold text-xs flex items-center gap-1.5 text-emerald-900">
              <FileCheck size={16} className="text-emerald-700" />
              <span>Next Steps for Form 80-IAC Submission</span>
            </h4>
            <ul className="text-[11px] space-y-1 text-emerald-800 list-disc list-inside">
              <li>Upload audited financial statements / CA Net Worth certificate.</li>
              <li>Upload pitch deck PDF (max 5MB) matching the video link.</li>
              <li>Submit application on the official Startup India National Portal.</li>
              <li>Appear for virtual presentation before the Inter-Ministerial Board if shortlisted.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

