// Seeds the database with the content that was hard-coded in the original page.
// Runs automatically on first start (when tables are empty). `npm run seed` resets content tables.
const db = require('./db');
const reset = process.argv.includes('--reset');

const tables = ['stats', 'projects', 'members', 'leaderboard', 'gallery', 'timeline', 'missions', 'feed', 'ori_faq'];
if (reset) tables.forEach(t => db.exec(`DELETE FROM ${t}`));
const empty = t => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c === 0;

function seed() {
  if (empty('stats')) {
    const s = db.prepare('INSERT INTO stats(key,label,value,sort) VALUES (?,?,?,?)');
    [['projects', 'Projects Built', 0], ['hackathons', 'Hackathons', 3], ['members', 'Members', 16],
    ['events', 'Events', 8], ['hours', 'Hours Coded', 52]].forEach((r, i) => s.run(r[0], r[1], r[2], i));
  }
  // Migrate the original seeded stats once, without overwriting admin-edited values.
  [['projects', 'Projects Built', 46, 0], ['hackathons', 'Hackathons', 31, 3],
  ['members', 'Members', 147, 16], ['hours', 'Hours Coded', 14892, 52]]
    .forEach(([key, label, oldValue, value]) => {
      db.prepare('UPDATE stats SET label=?,value=? WHERE key=? AND value=?').run(label, value, key, oldValue);
    });
  db.prepare("UPDATE stats SET key='events',label='Events',value=8 WHERE key='awards' AND value=72").run();
  if (empty('projects')) {
    const p = db.prepare('INSERT INTO projects(name,glyph,summary,stack,problem,solution,team,outcome_label,outcome,sort) VALUES (?,?,?,?,?,?,?,?,?,?)');
    [
      ['AeroSense', '🛰', 'Drone-based crop disease detection using edge AI — scanned 40,000+ acres with a student budget.', 'PyTorch,Jetson Nano,React', 'Farmers detect crop disease 2–3 weeks too late, losing 30% yield.', 'Autonomous drone flights + on-device vision model classifying leaf stress in real time.', '5 members · AI × Robotics × Web', 'AWARD', '🏆 Winner — National AgriTech Hackathon 2025'],
      ['NeuraTutor', '🧠', "An AI teaching assistant that generates personalized learning paths from a student's own mistakes.", 'Next.js,GPT-4,PostgreSQL', 'One-size-fits-all lectures leave 60% of students behind.', 'Agent that analyzes error patterns and rebuilds the syllabus per student, nightly.', '4 members · AI × Web', 'IMPACT', '2,300 students onboarded across 3 colleges.'],
      ['SentinelX', '🔐', 'Campus-wide security auditing toolkit — finds misconfigured systems before attackers do.', 'Python,Nmap,Burp', 'College infra runs legacy services nobody has audited since 2019.', 'Automated recon + vulnerability scoring dashboard with one-click remediation guides.', '3 members · Cyber Security', 'AWARD', '🥈 Finalist — National Cyber CTF 2024'],
      ['BoltBot', '🤖', 'Line-following, maze-solving, sumo-fighting robot — 3 national podiums and counting.', 'Embedded C,ROS,Fusion 360', 'Robotics teams needed a modular base platform to iterate fast.', 'Swappable sensor arrays + path-planning stack tuned for competition rules.', '6 members · Robotics × Embedded', 'AWARD', '🥇🥈🥉 3× National Podium'],
      ['GridPulse', '📡', 'Smart energy monitor for hostels — cut electricity waste 22% in a 6-month pilot.', 'ESP32,MQTT,Grafana', 'Hostels waste megawatts to idle appliances and phantom loads.', 'Per-room sensing with anomaly alerts and a public "green floor" leaderboard.', '4 members · IoT × Cloud', 'IMPACT', '22% energy reduction · adopted by campus admin.'],
      ['OpenTrack', '🌐', 'Open-source event management platform now used by 15+ college communities.', 'TypeScript,Supabase,Vercel', 'Every club rebuilds the same event-registration tooling from scratch.', 'One open-source platform: registrations, QR check-ins, certificates, analytics.', '5 members · Open Source × Web', 'IMPACT', '⭐ 1.2k GitHub stars · 15 communities self-hosting.'],
    ].forEach((r, i) => p.run(...r, i));
  }
  if (empty('members')) {
    const m = db.prepare('INSERT INTO members(name,role,skills,mission,projects,wins,sort) VALUES (?,?,?,?,?,?,?)');
    [
      ['K. Aishwarya', 'PRESIDENT // AI DIVISION', 'PyTorch,LLMs,Strategy', 'Current mission: shipping NeuraTutor v1.0 to 10 colleges.', 12, 4],
      ['M. Rakesh', 'SECRETARY', 'ROS,Control,CAD', 'Current mission: BoltBot Mk-IV torque calibration before nationals.', 11, 3],
      ['P. Nishank', 'JOINT SECRETARY', 'Next.js,Three.js,GSAP', 'Current mission: this website. yes, this one. it never ends.', 9, 2],
      ['S. Abhinav Rishi', 'MEMBER', 'Pentesting,CTF,Networks', 'Current mission: defending the club infra and attacking scoreboards.', 10, 5],
      ['Shlok Karn', 'MEMBER', 'TypeScript,Git,Community', 'Current mission: OpenTrack v2 — 2k stars or bust.', 8, 2],
      ['Mohit', 'MEMBER', 'Figma,Motion,Brand', 'Current mission: making engineers care about kerning.', 7, 1],
    ].forEach((r, i) => m.run(...r, i));
  }
  db.prepare("UPDATE members SET name='Mohit',role='MEMBER' WHERE name='Meera Nair'").run();
  db.prepare("UPDATE members SET name='S. Abhinav Rishi',role='MEMBER' WHERE name='Isha Rao'").run();
  db.prepare("UPDATE members SET name='P. Nishank',role='JOINT SECRETARY' WHERE name='Dev Patel'").run();
  db.prepare("UPDATE members SET name='M. Rakesh',role='SECRETARY' WHERE name='Zara Khan'").run();
  db.prepare("UPDATE members SET name='K. Aishwarya' WHERE name='Aarav Mehta'").run();
  db.prepare("UPDATE members SET name='Trideepa',role='MEMBER' WHERE name='Rohan Iyer'").run();
  db.prepare("UPDATE members SET name='Manashi',role='MEMBER' WHERE name='Ananya Gupta'").run();
  db.prepare("UPDATE members SET name='Shlok Karn',role='MEMBER' WHERE name='Kabir Singh'").run();
  db.prepare("UPDATE members SET name='Gayathri',role='MEMBER' WHERE name='Vikram Reddy'").run();
  db.prepare("UPDATE members SET name='Shravya',role='MEMBER' WHERE name='Priya Sharma'").run();
  db.prepare("UPDATE members SET name='Sai Charan',role='MEMBER' WHERE name='Arjun Nair'").run();
  db.prepare("UPDATE members SET name='Sri Charan',role='MEMBER' WHERE name='Sneha Rao'").run();
  db.prepare("UPDATE members SET name='Rahul',role='MEMBER' WHERE name='Karthik Patel'").run();
  db.prepare("UPDATE members SET name='Bhanu Prakash' WHERE name='Rahul Verma'").run();
  const additionalMembers = [
    ['Trideepa', 'MEMBER', 'AWS,Docker,CI/CD', 'Current mission: making every project deployment-ready.', 6, 2],
    ['Manashi', 'MEMBER', 'ESP32,MQTT,Sensors', 'Current mission: connecting campus devices to useful dashboards.', 5, 1],
    ['Gayathri', 'MEMBER', 'Python,Computer Vision,PyTorch', 'Current mission: testing practical computer-vision ideas.', 5, 1],
    ['Shravya', 'MEMBER', 'React,TypeScript,Accessibility', 'Current mission: making club tools easier for everyone to use.', 4, 1],
    ['Sai Charan', 'MEMBER', 'ROS,Embedded C,Control Systems', 'Current mission: building reliable autonomous robot demos.', 6, 2],
    ['Sri Charan', 'MEMBER', 'Figma,UI Systems,Prototyping', 'Current mission: turning student feedback into clear product flows.', 4, 1],
    ['Rahul', 'MEMBER', 'Linux,CTF,Network Security', 'Current mission: practicing defensive security through lab challenges.', 5, 2],
    ['Divya Menon', 'APP DEVELOPER', 'Flutter,Dart,Firebase', 'Current mission: prototyping helpful mobile experiences for students.', 3, 1],
    ['Bhanu Prakash', 'OPEN SOURCE CONTRIBUTOR', 'Git,JavaScript,Documentation', 'Current mission: helping more contributors find their first issue.', 4, 1],
    ['Nisha Kapoor', 'DATA & AUTOMATION', 'Python,SQL,Data Visualization', 'Current mission: turning project data into actionable insights.', 3, 1],
  ];
  const insertMember = db.prepare('INSERT INTO members(name,role,skills,mission,projects,wins,sort) VALUES (?,?,?,?,?,?,?)');
  const existingMembers = new Set(db.prepare('SELECT name FROM members').all().map(({ name }) => name));
  additionalMembers.forEach((member) => {
    if (!existingMembers.has(member[0])) {
      insertMember.run(...member, db.prepare('SELECT COALESCE(MAX(sort), -1) + 1 AS nextSort FROM members').get().nextSort);
      existingMembers.add(member[0]);
    }
  });
  if (empty('leaderboard')) {
    const l = db.prepare('INSERT INTO leaderboard(name,category,xp) VALUES (?,?,?)');
    [['M. Rakesh', 'Robotics', 4820], ['P. Nishank', 'Web', 4510], ['K. Aishwarya', 'AI', 4330], ['S. Abhinav Rishi', 'Cyber', 3900],
    ['Shlok Karn', 'Open Source', 3410], ['Mohit', 'Design', 3120], ['Trideepa', 'Cloud', 2870], ['Manashi', 'IoT', 2540]]
      .forEach(r => l.run(...r));
  }
  db.prepare("UPDATE leaderboard SET name='Mohit' WHERE name='Meera Nair'").run();
  db.prepare("UPDATE leaderboard SET name='S. Abhinav Rishi' WHERE name='Isha Rao'").run();
  db.prepare("UPDATE leaderboard SET name='P. Nishank' WHERE name='Dev Patel'").run();
  db.prepare("UPDATE leaderboard SET name='M. Rakesh' WHERE name='Zara Khan'").run();
  db.prepare("UPDATE leaderboard SET name='K. Aishwarya' WHERE name='Aarav Mehta'").run();
  db.prepare("UPDATE leaderboard SET name='Trideepa' WHERE name='Rohan Iyer'").run();
  db.prepare("UPDATE leaderboard SET name='Manashi' WHERE name='Ananya Gupta'").run();
  db.prepare("UPDATE leaderboard SET name='Shlok Karn' WHERE name='Kabir Singh'").run();
  if (empty('gallery')) {
    const g = db.prepare('INSERT INTO gallery(icon,caption,category,meta,sort) VALUES (?,?,?,?,?)');
    [['🏆', 'National AgriTech Hackathon — Winners', 'hack', 'hack · mar 2025'], ['🌙', '48 hours, zero sleep, one demo', 'hack', 'hack · feb 2026'],
    ['🤖', 'Robotics workshop: 60 bots, 60 grins', 'work', 'work · jan 2026'], ['🚐', 'Industrial visit — the datacenter trip', 'trip', 'trip · nov 2025'],
    ['🎉', 'Celebrating 147 members strong', 'win', 'win · aug 2025'], ['⚔', 'Inter-college CTF finals', 'comp', 'comp · oct 2025'],
    ['🧑‍💻', 'Build night #23 — whiteboards full', 'work', 'work · sep 2025'], ['🏅', 'BoltBot podium at nationals', 'comp', 'comp · dec 2025'],
    ['🍕', 'Demo day + pizza day (same day)', 'win', 'win · apr 2026'], ['🔧', 'PCB soldering marathon', 'work', 'work · jun 2025'],
    ['⛰', 'Team retreat to the hills', 'trip', 'trip · dec 2024'], ['🥈', 'SentinelX takes silver at Cyber CTF', 'comp', 'comp · jul 2024']]
      .forEach((r, i) => g.run(...r, i));
  }
  const timelineEntries = [
    ['2024', 'ORIGIN was born.', "A new chapter began for the CSE Department's technical community. ORIGIN set out to create opportunities for students to explore technology, collaborate, and learn beyond the classroom."],
    ['2025', 'Our First Hackathon.', "ORIGIN organized its first hackathon, bringing students together to turn ideas into practical solutions. It marked an important step in the club's journey toward hands-on technical learning and collaboration."],
    ['2025', 'A Growing Community.', 'ORIGIN began building its presence beyond campus activities, gaining college-level recognition and starting to establish its identity on social media. The focus was on connecting students with technical events, learning opportunities, and the wider community.'],
    ['2026', 'AI Division Started', 'ORIGIN is exploring the world of Artificial Intelligence, encouraging students to learn emerging technologies, experiment with ideas, and build practical skills.'],
    ['2026', 'Building Startups', 'From identifying real-world problems to developing project ideas, ORIGIN encourages students to think beyond the classroom and explore the possibilities of innovation and entrepreneurship.'],
    ['2026', 'You are here.', 'The next chapter needs builders. Scroll down and claim your seat.'],
  ];
  const originalTimeline = [
    ['2021', 'ORIGIN was born.', 'Seven students. One borrowed classroom. A whiteboard, a dream, and zero budget.'],
    ['2022', 'First Hackathon Win', 'Our web team took 1st place at the state-level hackathon — the first trophy of many.'],
    ['2023', 'National Recognition', 'Two national podiums, a research paper accepted, and 100+ members strong.'],
    ['2024', 'AI Division Started', "A dedicated AI lab, GPU access secured, and the club's first industry collaboration."],
    ['2025', 'Building Startups', "Three member-founded startups in incubation. ORIGIN is no longer just a club — it's a launchpad."],
    ['2026', 'You are here.', 'The next chapter needs builders. Scroll down and claim your seat.'],
  ];
  const timelineInsert = db.prepare('INSERT INTO timeline(year,title,body,sort) VALUES (?,?,?,?)');
  if (empty('timeline')) {
    timelineEntries.forEach((entry, i) => timelineInsert.run(...entry, i));
  } else {
    const current = db.prepare('SELECT year,title,body FROM timeline ORDER BY sort').all();
    const isOriginalTimeline = current.length === originalTimeline.length && current.every((entry, i) =>
      entry.year === originalTimeline[i][0] && entry.title === originalTimeline[i][1] && entry.body === originalTimeline[i][2]);
    if (isOriginalTimeline) {
      db.transaction(() => {
        db.prepare('DELETE FROM timeline').run();
        timelineEntries.forEach((entry, i) => timelineInsert.run(...entry, i));
      })();
    }
  }
  if (empty('missions')) {
    const m = db.prepare('INSERT INTO missions(name,status,description,sort) VALUES (?,?,?,?)');
    [['🛰 AeroSense v2', 'live', 'Field trial #12 scheduled · drone fleet charging · model retraining tonight.'],
    ['🧠 NeuraTutor', 'live', '1,142 active learners · agent pipeline healthy · v0.9 releasing Friday.'],
    ['⚡ HackXtreme 2026', 'soon', 'Flagship hackathon · registrations open · 48h · ₹1.5L prize pool.'],
    ['🧪 Robotics Lab', 'live', 'BoltBot Mk-IV assembly at 40% · torque tests passing.']]
      .forEach((r, i) => m.run(...r, i));
  }
  if (empty('feed')) {
    const f = db.prepare('INSERT INTO feed(icon,text) VALUES (?,?)');
    [['⎇', 'AeroSense model retrain queued'], ['✦', 'Isha.Rao +50 XP — CTF qualifier'], ['⎇', 'OpenTrack PR #142 merged'],
    ['✦', 'Meera.Nair +30 XP — brand kit v3'], ['⎇', 'BoltBot Mk-IV part printed'], ['✦', 'Ananya.Gupta +20 XP — sensor docs'],
    ['⎇', 'HackXtreme: 12 new registrations']].forEach(r => f.run(...r));
  }
  if (empty('ori_faq')) {
    const q = db.prepare('INSERT INTO ori_faq(pattern,answer,sort) VALUES (?,?,?)');
    [
      ['join|recruit|apply|membership', 'Joining is easy: 4 steps — apply, build challenge, hangout, deploy. Hit the big "Join ORIGIN" button, or type <b>sudo recruit me</b> anywhere. Even here. Try it.'],
      ['hackathon|hackxtreme|competition', '<b>HackXtreme 2026</b> is our flagship: 48 hours, ₹1.5L prize pool, team formation opens 2 weeks prior. We also run internal mini-hacks every month.'],
      ['event|workshop|when|where|schedule', 'Workshops: every Friday 6PM, Lab-2. Next big event: <b>HackXtreme 2026</b>. Demo days end of each semester. Pizza is statistically guaranteed.'],
      ['project|portfolio|built', '46 projects live — AeroSense (drone AI), NeuraTutor (learning agents), SentinelX (security), BoltBot (robotics). Scroll to PROJECTS, hover the cards.'],
      ['resource|learn|roadmap|study|road map', 'Every member gets a learning roadmap + access to our GPU lab, course vault, and senior mentorship. Domains cover AI, Web, Cyber, Cloud, IoT, Robotics and Open Source.'],
      ['who|what|origin|about|club', 'ORIGIN is the departmental technical club — but really it is an innovation hub, startup incubator and hacker family. Est. 2021. 147 members. Motto: ideas don’t stay ideas here.'],
      ['hi|hello|hey|yo', 'Hey, builder. I am ORI — ORIGIN’s assistant. Ask me about joining, hackathons, events, or projects.'],
      ['xp|leaderboard|points|score', 'Earn XP for coding, design, content, volunteering and mentoring. Top of the leaderboard gets first pick of hardware, missions and hackathon slots. Gamification is not a gimmick here.'],
    ].forEach((r, i) => q.run(...r, i));
  }
}

db.transaction(seed)();
if (require.main === module) console.log(reset ? 'Database content reset and re-seeded.' : 'Seed check complete.');
module.exports = seed;
