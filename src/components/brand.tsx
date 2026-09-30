type BrandProps = {
  className?: string;
  markClassName?: string;
};

export function Brand({
  className = "",
  markClassName = "size-7",
}: BrandProps) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 font-heading font-semibold text-xl text-foreground tracking-[-0.04em] ${className}`}
    >
      <img
        aria-hidden="true"
        alt=""
        src="/logo-mark.svg"
        className={`shrink-0 ${markClassName}`}
      />
      <span>Geregeld</span>
    </span>
  );
}
