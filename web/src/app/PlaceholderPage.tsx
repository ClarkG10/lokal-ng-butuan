import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="section-y">
      <div className="container-page max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Coming soon
        </p>
        <h1 className="text-display mt-2 font-display font-bold">{title}</h1>
        {description && (
          <p className="mt-4 text-muted-foreground md:text-lg">{description}</p>
        )}
        <div className="mt-8">
          <Button asChild variant="secondary">
            <Link to="/">← Back home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
