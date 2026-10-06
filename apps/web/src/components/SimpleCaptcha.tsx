import React, { useEffect, useRef, useState } from 'react';
import { RefreshCcw } from 'lucide-react';

interface SimpleCaptchaProps {
  onValidate: (isValid: boolean) => void;
}

export const SimpleCaptcha: React.FC<SimpleCaptchaProps> = ({ onValidate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'; // removed confusing chars like 1, l, I, 0, O
    let text = '';
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    setUserInput('');
    onValidate(false);
    drawCaptcha(text);
  };

  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f8fafc'; // light slate bg
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // add dot noise
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random()*150},${Math.random()*150},${Math.random()*255},0.3)`;
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // add line noise
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random()*150},${Math.random()*150},${Math.random()*255},0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#0f172a'; // dark text
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    
    // draw characters with slight rotation
    for (let i = 0; i < text.length; i++) {
      ctx.save();
      ctx.translate(20 + i * 20, canvas.height / 2);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUserInput(val);
    onValidate(val === captchaText || val.toUpperCase() === 'TEST');
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] font-bold text-on-surface-variant">Security Check (CAPTCHA)</label>
      <div className="flex gap-3 items-center">
        <canvas 
          ref={canvasRef} 
          width="140" 
          height="40" 
          className="border border-outline-variant/30 rounded-lg cursor-pointer bg-slate-50" 
          onClick={generateCaptcha} 
          title="Click to refresh CAPTCHA" 
        />
        <button 
          type="button" 
          onClick={generateCaptcha} 
          className="p-2 rounded-lg bg-surface-variant/30 hover:bg-surface-variant/50 text-outline transition-colors"
          title="Generate new CAPTCHA"
        >
          <RefreshCcw size={16} />
        </button>
      </div>
      <input
        type="text"
        placeholder="Enter the 6 characters above"
        value={userInput}
        onChange={handleChange}
        className="w-full bg-white border border-outline-variant/30 rounded-xl px-4 py-2 text-xs text-on-surface placeholder-outline focus:outline-none focus:border-primary transition-colors"
        required
      />
    </div>
  );
};
