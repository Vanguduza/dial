

import Link from "next/link";
import {
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";

import {
  companyLinks,
  socialLinks,
  supportLinks,
} from "./footerLinks";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
    const currentYear = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t bg-background">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link
              href="/tech"
              className="flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">
                F
              </div>

              <div>
                <h3 className="text-2xl font-bold">
                  Dial a Tech
                </h3>

                <p className="text-sm text-muted-foreground">
                  Home Services
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-md leading-7 text-muted-foreground">
              Dial a Tech connects homeowners with trusted, verified technicians
              for plumbing, electrical work, AC repair, cleaning, painting,
              carpentry, and more.
            </p>

            {/* Contact */}

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                hello@dial.africa
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-primary" />
                +263 242 000 000
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                Harare, Zimbabwe
              </div>
            </div>

            {/* Social */}

            <div className="mt-8 flex gap-3">
              {socialLinks.map(({ icon: Icon, href }, index) => (
                <Link
                  key={index}
                  href={href}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}

          <div>
            <h4 className="mb-5 text-lg font-semibold">
              Company
            </h4>

            <div className="space-y-3">
              {companyLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-muted-foreground transition hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Support */}

          <div>
            <h4 className="mb-5 text-lg font-semibold">
              Support
            </h4>

            <div className="space-y-3">
              {supportLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="block text-muted-foreground transition hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}

          <div>
            <h4 className="mb-5 text-lg font-semibold">
              Newsletter
            </h4>

            <p className="mb-5 text-sm text-muted-foreground">
              Subscribe to receive home maintenance tips and exclusive offers.
            </p>

            <div className="space-y-3">
              <Input
                placeholder="Enter your email"
                type="email"
              />

              <Button className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm text-muted-foreground md:flex-row">
          <p>
            © {currentYear} Dial a Tech. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/tech/privacy-policy" className="hover:text-primary">
              Privacy
            </Link>

            <Link href="/tech/terms" className="hover:text-primary">
              Terms
            </Link>

            <Link href="/tech/cookies" className="hover:text-primary">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}