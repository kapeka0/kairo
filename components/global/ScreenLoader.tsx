"use client";

import Image from "next/image";

function ScreenLoader() {
  console.log("ScreenLoader");
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="relative">
        <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 opacity-75" />

        <div className="relative animate-smooth-pulse">
          <Image
            src="/images/logos/logo.svg"
            alt="Loading..."
            width={80}
            height={56}
            className="h-14 w-20"
            priority
          />
        </div>
      </div>
    </div>
  );
}

export default ScreenLoader;
