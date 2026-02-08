import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("common");

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold">SwiftCart</h1>
      <p className="text-muted-foreground mt-4">Modern e-commerce built with Next.js</p>
    </div>
  );
}
