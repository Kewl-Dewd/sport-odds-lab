import { Link } from "react-router-dom";
import { useOpenCookieSettings } from "@/components/consent/CookieConsent";

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: "What we collect",
    body: "When you create an account we store your name, email address, role (student or instructor) and the work you do in the lab, such as forecasts, positions, quiz answers and reflections. Feedback you send is anonymous unless you choose to add an email.",
  },
  {
    title: "Visit measurement",
    body: "We count page visits, time on page, speed and errors without cookies and without identifying you. If you accept analytics, we also measure clicks and other actions on the site.",
  },
  {
    title: "Advertising measurement (Meta)",
    body: "If you accept advertising cookies, our public pages (home, For Instructors, For Administrators, How It Works and sign-up) load the Meta Pixel. It tells Meta, the company behind Facebook and Instagram, that you visited those pages and, if you create an instructor account, that an account was created. Meta may use this, together with its own cookies and information it holds about you, to measure our ads and to show them to people likely to be interested. We do not send your name, email or any class activity to Meta, and signed-in class pages never load the pixel. In Canada and Europe this only happens after you accept; elsewhere it is on unless you reject it or your browser sends a Global Privacy Control signal.",
  },
  {
    title: "Your choices",
    body: "You can accept or reject analytics and advertising separately and change your mind at any time from Cookie settings in the footer. A rejection stops new measurement straight away. You can also manage ad preferences in your Facebook or Instagram settings.",
  },
  {
    title: "How we use and keep your information",
    body: "We use account information to run the course, show results to you and your instructor, and support you. We do not sell your information. Class data is kept while your account is active; ask us to delete it at any time.",
  },
];

export default function Privacy() {
  const openCookieSettings = useOpenCookieSettings();
  return (
    <div className="container max-w-3xl px-5 py-12 sm:py-16">
      <div className="section-kicker mb-4">Privacy</div>
      <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
        Privacy <span className="font-editorial font-normal italic text-primary">policy</span>
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">Sports Market Lab, operated by Avason Systems. Last updated November 18, 2026.</p>
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">{s.title}</h2>
            <p className="mt-2 leading-7 text-muted-foreground">{s.body}</p>
          </section>
        ))}
        <section>
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em]">Contact</h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            Questions, or a request to see or delete your information: <a className="underline underline-offset-4" href="mailto:support@avasonsystems.com">support@avasonsystems.com</a>.
          </p>
        </section>
      </div>
      <div className="mt-10 flex flex-wrap gap-4 text-sm">
        <button type="button" onClick={openCookieSettings} className="font-medium underline underline-offset-4">Cookie settings</button>
        <Link to="/" className="font-medium underline underline-offset-4">Back home</Link>
      </div>
    </div>
  );
}
