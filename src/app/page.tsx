export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-4 tracking-tighter">CanopyCheck</h1>
      <p className="text-zinc-400 max-w-md text-center mb-8">
        Secure Access Required. Please sign in to continue.
      </p>

      <div className="p-6 border border-zinc-800 rounded-lg bg-zinc-950 w-full max-w-sm">
        <p className="text-sm text-center text-zinc-500">
          (Login Logic to be implemented by Person 1)
        </p>
      </div>
    </div>
  );
}
