import React, { useEffect, useRef, useState } from 'react';
import { RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SimpleCaptchaProps {
  onValidate: (isValid: boolean) => void;
}

export const SimpleCaptcha: React.FC<SimpleCaptchaProps> = ({ onValidate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [serverVerified, setServerVerified] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setUserInput('');
    setServerVerified(null);
    onValidate(false);
    drawCaptcha(text);
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // add dot noise
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 150},${Math.random() * 150},${Math.random() * 255},0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // add line noise
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 150},${Math.random() * 150},${Math.random() * 255},0.25)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#0f172a';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(20 + i * 20, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.35);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const verifyWithServer = async (input: string) => {
    if (input.length < 5) {
      setServerVerified(null);
      onValidate(false);
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/auth/verify-captcha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'session-challenge',
          solution: input,
          expected: captchaText,
        }),
      });
      const data = await res.json();
      const valid = Boolean(data.valid);
      setServerVerified(valid);
      onValidate(valid);
    } catch {
      // Fallback exact match comparison if offline
      const valid = input.trim().toLowerCase() === captchaText.trim().toLowerCase();
      setServerVerified(valid);
      onValidate(valid);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);
    if (val.length === 6) {
      verifyWithServer(val);
    } else {
      setServerVerified(null);
      onValidate(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="captcha-input" className="text-[11px] font-bold text-slate-700">
        Security Verification (CAPTCHA) *
      </label>
      <div className="flex gap-3 items-center">
        <canvas
          ref={canvasRef}
          width="140"
          height="40"
          className="border border-slate-300 rounded-lg cursor-pointer bg-slate-50 shadow-xs"
          onClick={generateCaptcha}
          title="Click to refresh CAPTCHA"
          aria-label="CAPTCHA image challenge"
        />
        <button
          type="button"
          onClick={generateCaptcha}
          aria-label="Refresh security captcha challenge"
          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          title="Generate new CAPTCHA"
        >
          <RefreshCcw size={16} />
        </button>
        {isVerifying && <span className="text-[10px] text-slate-500 animate-pulse">Verifying...</span>}
        {serverVerified === true && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
            <CheckCircle2 size={15} /> Verified
          </span>
        )}
        {serverVerified === false && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
            <AlertCircle size={15} /> Incorrect
          </span>
        )}
      </div>
      <input
        type="text"
        id="captcha-input"
        value={userInput}
        onChange={handleChange}
        placeholder="Enter the 6 characters above"
        aria-label="Enter security captcha text"
        maxLength={6}
        required
        className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono tracking-wider transition-all"
      />
    </div>
  );
};
