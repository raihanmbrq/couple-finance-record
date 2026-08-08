import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface AvatarCropSheetProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onSave: (file: File) => Promise<void>;
}

const ROTATION_2X_SIZE = 100;
const PADDING = ROTATION_2X_SIZE / 2;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context tidak tersedia.');

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = (() => {
    const absCos = Math.abs(Math.cos(rotRad));
    const absSin = Math.abs(Math.sin(rotRad));
    return {
      width: Math.ceil(image.width * absCos + image.height * absSin),
      height: Math.ceil(image.width * absSin + image.height * absCos),
    };
  })();

  canvas.width = bBoxWidth + PADDING * 2;
  canvas.height = bBoxHeight + PADDING * 2;

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) throw new Error('Canvas context tidak tersedia.');

  croppedCanvas.width = Math.round(pixelCrop.width);
  croppedCanvas.height = Math.round(pixelCrop.height);
  croppedCtx.drawImage(
    canvas,
    Math.round(pixelCrop.x) + PADDING,
    Math.round(pixelCrop.y) + PADDING,
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
    0,
    0,
    Math.round(pixelCrop.width),
    Math.round(pixelCrop.height),
  );

  return new Promise((resolve, reject) => {
    croppedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Gagal memproses gambar.'));
          return;
        }
        resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      0.92,
    );
  });
}

export function AvatarCropSheet({ open, onClose, imageSrc, onSave }: AvatarCropSheetProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError('');
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    setError('');
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      await onSave(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan foto profil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="Atur Crop Foto">
      <div className="space-y-4">
        <div className="relative h-72 rounded-2xl overflow-hidden bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-text-secondary w-12 shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-text-secondary w-12 shrink-0">Rotate</span>
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <span className="text-xs text-text-secondary w-8 shrink-0 text-right">{rotation}°</span>
          </div>
        </div>

        {error && <p className="text-sm text-expense">{error}</p>}

        <Button fullWidth onClick={handleSave} disabled={saving || !croppedAreaPixels}>
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Menyimpan...
            </span>
          ) : (
            'Simpan Foto Profil'
          )}
        </Button>
      </div>
    </Sheet>
  );
}