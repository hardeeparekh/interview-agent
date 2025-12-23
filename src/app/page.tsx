import Nav from "../components/Nav";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Preview from "../components/Preview";
import Footer from "../components/Footer";
import AuthOverlay from "../components/AuthOverlay";

export default function Page() {
  return (
    <>
      <Nav />
      <main id="landing-page" className="relative pt-32">
        <div className="hero-gradient absolute inset-0 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 relative">
          <section className="text-center mb-24">
            <Hero />
          </section>

          <section>
            <Features />
          </section>

          <section>
            <Preview />
          </section>

          <section>
            <Footer />
          </section>
        </div>
      </main>
      <AuthOverlay />
    </>
  );
}

