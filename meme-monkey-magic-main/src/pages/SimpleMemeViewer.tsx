import MemeFetcher from "@/components/MemeFetcher";

export default function SimpleMemeViewer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5 p-4 flex items-center justify-center">
      <MemeFetcher />
    </div>
  );
}