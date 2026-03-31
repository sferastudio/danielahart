import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden md:flex md:w-[45%] relative flex-col items-center justify-center bg-gradient-to-br from-[#002D4F] to-[#00162a] text-white overflow-hidden">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 auth-geo-pattern" />
        {/* Decorative angular shapes */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.04]"
          viewBox="0 0 400 800"
          preserveAspectRatio="xMidYMid slice"
        >
          <polygon points="200,50 350,400 200,750 50,400" fill="none" stroke="white" strokeWidth="1.5" />
          <polygon points="200,150 300,400 200,650 100,400" fill="none" stroke="white" strokeWidth="1" />
          <polygon points="200,250 250,400 200,550 150,400" fill="none" stroke="white" strokeWidth="0.5" />
        </svg>
        {/* Centered logo */}
        <div className="relative z-10 animate-fade-in">
          <Image
            src="/logo.png"
            alt="Daniel Ahart Tax"
            width={320}
            height={96}
            priority
            className="brightness-0 invert"
          />
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col w-full md:w-[55%] min-h-screen bg-white">
        {/* Mobile navy accent bar + logo */}
        <div className="md:hidden bg-gradient-to-r from-[#002D4F] to-[#00162a] flex items-center justify-center py-6">
          <Image
            src="/logo.png"
            alt="Daniel Ahart Tax"
            width={200}
            height={60}
            priority
            className="brightness-0 invert"
          />
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
