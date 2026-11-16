import { Link } from "react-router-dom";
import { Mail, Twitter, Instagram, Linkedin, Youtube } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/", isRoute: true },
  { label: "Features", href: "/#fitur", isRoute: false },
  { label: "Syllabus", href: "/syllabus", isRoute: true },
  { label: "Modul", href: "/modules", isRoute: true },
  { label: "Request", href: "/#request", isRoute: false },
];

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Youtube, href: "#", label: "YouTube" },
];

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background py-16 md:py-20">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 mb-12 md:mb-16">
          {/* Logo & Tagline */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-semibold tracking-tight text-background">
                Learn<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-background/70 max-w-sm leading-relaxed">
              Platform belajar AI dan Automation yang dirancang untuk membantu Anda
              menguasai teknologi masa depan dengan cara yang mudah dan terarah.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-5 tracking-wide uppercase">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-background/70 hover:text-background transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-background/70 hover:text-background transition-colors duration-200 text-sm"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="text-sm font-semibold text-background mb-5 tracking-wide uppercase">
              Contact
            </h4>
            <a
              href="mailto:hello@learnai.id"
              className="inline-flex items-center gap-2 text-background/70 hover:text-background transition-colors duration-200 text-sm mb-6"
            >
              <Mail className="w-4 h-4" />
              hello@learnai.id
            </a>

            <h4 className="text-sm font-semibold text-background mb-4 tracking-wide uppercase mt-6">
              Follow Us
            </h4>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors duration-200"
                >
                  <social.icon className="w-4 h-4 text-background" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-background/50 text-sm flex flex-col md:flex-row items-center gap-1 md:gap-2">
              <span>© {currentYear} LearnInk. All rights reserved.</span>
              <span className="hidden md:inline text-background/30">•</span>
              <span className="flex items-center gap-1">
                Powered by
                <a
                  href="https://lynk.id/abelion"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary transition-colors font-medium underline underline-offset-2 decoration-background/30"
                >
                  Abelion
                </a>
              </span>
            </p>
            <div className="flex items-center gap-6 text-sm">
              <a
                href="#"
                className="text-background/50 hover:text-background transition-colors duration-200"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-background/50 hover:text-background transition-colors duration-200"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
