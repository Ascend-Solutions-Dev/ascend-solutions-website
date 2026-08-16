import Link from "next/link";
import Image from "next/image";

export function Header() {
  return <header className="site-header"><nav className="nav-shell" aria-label="Primary navigation"><Link className="brand-logo" href="/" aria-label="Ascend Solutions home"><Image src="/brand/ascend-long-light.png" alt="Ascend Solutions" width={2061} height={595} priority /></Link><ul className="nav-links"><li><Link href="/apps">Our Apps</Link></li><li><Link href="/#about">Our Story</Link></li><li><Link href="/legal">Legal</Link></li><li><a className="button button-orange" href="mailto:hello@ascendsolutions.dev">Get in touch</a></li></ul></nav></header>;
}

export function Footer() {
  return <footer className="site-footer"><div className="footer-shell"><div className="footer-top"><div className="footer-brand"><Image className="footer-logo" src="/brand/ascend-long-dark.png" alt="Ascend Solutions" width={2061} height={595} /><p className="footer-copy">Technology built for families. Based in Utah and built with purpose.</p></div><div><p className="footer-title">Explore</p><ul className="footer-links"><li><Link href="/apps">Our Apps</Link></li><li><Link href="/#values">Our Values</Link></li><li><Link href="/#about">Our Story</Link></li></ul></div><div><p className="footer-title">Connect</p><ul className="footer-links"><li><a href="mailto:hello@ascendsolutions.dev">Contact Us</a></li><li><Link href="/legal">Privacy Policy</Link></li><li><Link href="/legal#tos">Terms of Service</Link></li></ul></div></div><div className="footer-bottom"><span>© 2026 Ascend Solutions LLC</span><span>Utah, USA</span></div></div></footer>;
}
