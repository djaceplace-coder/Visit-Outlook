interface LogoProps {
  className?: string;
  alt?: string;
}

export function Logo({ className = "w-12 h-12", alt = "Outlook Logo" }: LogoProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-2xl bg-[#F5F5F5] border border-gray-200/60 shadow-xs flex-shrink-0 select-none ${className}`}
    >
      <img
        src="/Gemini_Generated_Image_ll19vill19vill19.jpg"
        alt={alt}
        className="w-full h-full object-cover"
        loading="eager"
      />
    </div>
  );
}

