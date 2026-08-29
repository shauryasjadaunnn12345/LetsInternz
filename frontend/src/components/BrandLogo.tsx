import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({
  href = "/",
  size = "md",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions = {
    sm: "h-9 w-[7.5rem]",
    md: "h-11 w-[9.5rem]",
    lg: "h-14 w-[12rem]",
  }[size];

  return (
    <Link href={href} className={`relative block shrink-0 ${dimensions}`} aria-label="LetsInternz home">
      <Image
        src="/letsinternz.png"
        alt="LetsInternz"
        fill
        sizes="192px"
        className="object-contain object-left"
        priority={size === "lg"}
      />
    </Link>
  );
}