import { LoginGoogle } from "@/components/login-google";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#121212] p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-12 text-[#1DB954]"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
        </svg>
        <LoginGoogle />
      </div>
    </div>
  );
}
