function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function WelcomeBanner({ name }: { name: string }) {
  return (
    <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
      {getGreeting()}, {name} 👋
    </h1>
  );
}
