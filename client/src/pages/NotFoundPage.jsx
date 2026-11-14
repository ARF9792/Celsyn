import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="panel not-found-panel" data-enter>
      <p className="section-kicker">Route unavailable</p>
      <h2>This operations screen does not exist.</h2>
      <p>Return to the current fleet safety overview.</p>
      <Link className="text-action" to="/app/overview"><ArrowLeft size={16} />Open fleet safety</Link>
    </section>
  );
}
