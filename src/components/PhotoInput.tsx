import { Camera, X, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
}

function compressImage(file: File, maxSize = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PhotoInput({ value, onChange, label = "拍现场照片" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const base64 = await compressImage(file);
      onChange(base64);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (value) {
    return (
      <div className="relative w-full overflow-hidden rounded-btn border-2 border-site-pass bg-site-passBg">
        <img src={value} alt="现场照片" className="h-40 w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-site-fail text-white shadow-lg transition-transform active:scale-90"
          aria-label="删除照片"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-body-md font-semibold text-white">
          ✓ 已拍照
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={loading}
      className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-btn border-2 border-dashed border-site-border bg-gray-50 text-site-darkLight transition-colors active:bg-site-orange/10 active:border-site-orange/60"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
      {loading ? (
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-site-orange border-t-transparent" />
      ) : (
        <>
          <div className="flex gap-2">
            <Camera size={28} className="text-site-orange" strokeWidth={2} />
            <ImageIcon size={28} className="text-site-darkLight" strokeWidth={2} />
          </div>
          <span className="text-body-md font-semibold">{label}</span>
        </>
      )}
    </button>
  );
}
