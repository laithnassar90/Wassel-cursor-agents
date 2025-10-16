import { cn } from "./ui/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export function LoadingSpinner({ 
  className, 
  size = "md", 
  text = "Loading..." 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-4", className)}>
      <div className={cn(
        "border-2 border-primary border-t-transparent rounded-full animate-spin",
        sizeClasses[size]
      )} />
      {text && (
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

export function PageLoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" text="Loading page..." />
    </div>
  );
}

export function ComponentLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <LoadingSpinner text="Loading component..." />
    </div>
  );
}