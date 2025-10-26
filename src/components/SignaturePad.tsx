import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { X, RotateCcw } from 'lucide-react';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Convert canvas to base64 (without data:image/png;base64, prefix)
    const dataUrl = canvas.toDataURL('image/png');
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    
    onSave(base64);
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 text-center">
          ✍️ Vẽ chữ ký của bạn bên dưới
        </p>
        <canvas
          ref={canvasRef}
          className="w-full h-48 border border-gray-200 dark:border-gray-700 rounded bg-white"
          style={{ cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 28 28\'><defs><linearGradient id=\'g1\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'0%25\'><stop offset=\'0%25\' style=\'stop-color:%23FFD700\'/><stop offset=\'100%25\' style=\'stop-color:%23FFA500\'/></linearGradient><linearGradient id=\'g2\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'0%25\'><stop offset=\'0%25\' style=\'stop-color:%231a1a1a\'/><stop offset=\'100%25\' style=\'stop-color:%23000000\'/></linearGradient></defs><path d=\'M3 27L8 22L26 4L24 2L6 20L1 25L3 27Z\' fill=\'url(%23g1)\' stroke=\'%23B8860B\' stroke-width=\'0.5\'/><rect x=\'8\' y=\'20\' width=\'18\' height=\'3\' rx=\'1\' transform=\'rotate(-45 8 20)\' fill=\'url(%23g2)\' stroke=\'%23333\' stroke-width=\'0.5\'/><circle cx=\'2\' cy=\'26\' r=\'1.2\' fill=\'%23000\'/></svg>") 2 27, auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="flex justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={clear}
          disabled={isEmpty}
          size="sm"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Xóa
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          size="sm"
        >
          <X className="h-4 w-4 mr-2" />
          Hủy
        </Button>
        <Button
          type="button"
          onClick={save}
          disabled={isEmpty}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          size="sm"
        >
          💾 Lưu chữ ký
        </Button>
      </div>
    </div>
  );
}

