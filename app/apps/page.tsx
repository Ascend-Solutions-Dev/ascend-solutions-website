import { Footer, Header } from "../site-shell";

const apps = [
  ["🌱","Grow Together","Track milestones, celebrate wins, and build healthy habits as a family."],
  ["📸","Family Memories","A private family album and journal for sharing moments and preserving memories."],
  ["💰","Family Budget","Shared household budgeting that keeps everyone on the same financial page."],
  ["🎓","Learn Together","Homework, reading, and study tools that make learning feel supported at home."],
  ["❤️","Family Wellness","Mental and physical wellness tracking for routines, moods, and mutual support."],
  ["✨","More coming","We are always listening for the next household problem worth solving."],
];

export default function AppsPage(){return <><Header/><main>
  <section className="page-hero"><div className="page-hero-shell"><span className="eyebrow">Our apps</span><h1 className="page-title">Tools built for real family life.</h1><p className="page-lead">We are building around the routines that keep a home moving—meals, schedules, memories, money, learning, and the small details in between.</p></div></section>
  <section className="section"><div className="section-shell"><article className="featured-app"><div><span className="eyebrow">Featured app · Coming soon</span><h2>Pantrii</h2><p>A calmer way to manage food. Pantrii helps families remember what they have, use it before it expires, plan meals, and keep the grocery list current.</p><ul className="feature-list"><li>Smart pantry tracking and expiration alerts</li><li>Meal ideas based on what is already in your kitchen</li><li>Intelligent shopping lists that calculate what you need</li><li>Less food waste and more money saved each week</li></ul><a className="button button-orange" href="#waitlist">Join the waitlist</a></div><div className="pantrii-preview" aria-label="Pantrii app preview"><div className="preview-top"><strong>Pantrii</strong><span className="preview-pill">Preview</span></div><div className="preview-alert">⚠️ <strong>3 items expiring soon</strong><br/>Milk, spinach, and Greek yogurt</div><div className="preview-items"><div className="preview-item"><span>🥛 Milk · 1 gallon</span><span>2 days</span></div><div className="preview-item"><span>🥚 Eggs · 6 left</span><span>12 days</span></div><div className="preview-item"><span>🥬 Spinach · 1 bag</span><span>1 day</span></div></div></div></article></div></section>
  <section className="section apps-section"><div className="section-shell"><div className="section-heading"><span className="eyebrow">On the roadmap</span><h2 className="section-title">More from Ascend Solutions.</h2></div><div className="portfolio-grid">{apps.map(([icon,title,copy])=><article className="portfolio-card" key={title}><div className="value-icon">{icon}</div><h3>{title}</h3><p>{copy}</p><span className="app-status">Planned</span></article>)}</div></div></section>
  <section className="section" id="waitlist"><div className="section-shell"><div className="waitlist"><div><h2>Be the first to try Pantrii.</h2><p>Join our early-access list and follow the journey.</p></div><a className="button button-navy" href="mailto:skyler@ascendsolutions.dev?subject=Pantrii%20Waitlist">Join the waitlist</a></div></div></section>
  </main><Footer/></>}
