import { cn } from "@/lib/utils";

interface ProjectCoverProps {
  name: string;
  coverImage?: string | null;
  className?: string;
}

export function ProjectCover({ name, coverImage, className }: ProjectCoverProps) {
  if (coverImage) {
    return (
      <div className={cn("relative overflow-hidden rounded-t-2xl bg-muted", className)}>
        <img src={coverImage} alt={name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    );
  }

  const initial = name.charAt(0).toUpperCase();
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-t-2xl bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 text-4xl font-bold text-white/90",
        className
      )}
    >
      {initial}
    </div>
  );
}
