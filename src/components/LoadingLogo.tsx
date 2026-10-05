"use client";

type LoadingLogoProps = {
  size?: number;
  text?: string;
  fullScreen?: boolean;
};

export default function LoadingLogo({
  size = 64,
  text = "Loading...",
  fullScreen = true,
}: LoadingLogoProps) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <img
        src="/triangles-logo.png"
        alt="TRIANGLES"
        style={{
          width: size,
          height: size,
        }}
        className="object-contain animate-spin"
      />

      {text && (
        <p className="mt-4 text-sm text-[#68736E]">
          {text}
        </p>
      )}
    </div>
  );

  if (!fullScreen) {
    return content;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F7F2]">
      {content}
    </div>
  );
}