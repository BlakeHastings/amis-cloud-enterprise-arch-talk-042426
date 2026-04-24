const posts = [
  {
    id: 1,
    title: "My Blog Is Running on the Dell Under My Desk",
    date: "June 8, 2024",
    category: "Home Lab",
    summary: "I didn't want to pay for hosting, and honestly I wanted to learn. So I turned an old Dell Optiplex into a web server and pointed my domain at my house. Here's what that looks like.",
    body: `
      <p>When I started this blog, the obvious move was to sign up for a shared hosting plan. $6/month, click through a wizard, done. Instead I took the hard road.</p>
      <p>I had an old Dell Optiplex sitting in a closet. It was six years old, had 8GB of RAM, and nobody in the house wanted it. I wiped it, installed Ubuntu Server, and set it up as a web server.</p>
      <h2>What the setup actually looks like</h2>
      <p>My "server room" is a corner of my home office. There's a single machine running nginx, serving static HTML files. My router has a port-forward on 80 and 443 pointing at it. My domain is pointed at my home IP through a dynamic DNS service because my ISP doesn't give me a static address.</p>
      <p>Total cost: $0/month. Electricity, maybe $2.</p>
      <h2>Why do this at all?</h2>
      <p>Two reasons. One, I wanted to actually understand what happens when someone types my URL and hits enter. Shared hosting abstracts all of that away. With my own machine, I can see the logs, tweak the config, break things, fix them.</p>
      <p>Two, it's kind of fun. There's something satisfying about knowing that when you visit my site, the electrons are traveling from literally under my desk to your screen.</p>
      <p>I didn't realize at the time that I was about to learn every hard lesson in distributed systems, the hard way, over the next two years.</p>
    `
  },
  {
    id: 2,
    title: "More RAM Won't Save You Forever",
    date: "January 14, 2025",
    category: "Scaling",
    summary: "When my blog started getting real traffic, I did what felt obvious: I made the machine stronger. That worked until it didn't. This is the difference between scaling up and scaling out.",
    body: `
      <p>Six months after I set up the home server, the blog started getting traction. A few posts picked up steam on Reddit and Hacker News, and suddenly I had real traffic.</p>
      <p>The first thing I noticed was that during traffic spikes, pages got slow. The server wasn't crashing — it was just laboring. CPU pegged at 100%, RAM full, disk I/O maxed.</p>
      <h2>The obvious fix</h2>
      <p>I did what felt natural: I made the computer stronger. I bought 32GB of RAM, swapped the spinning disk for an SSD, and upgraded to a CPU I found on eBay. Total spend: about $180.</p>
      <p>It worked. For a while. The next few traffic spikes handled easily. I felt good about myself.</p>
      <h2>Where it fell apart</h2>
      <p>Around Christmas, one of my posts got featured in a newsletter with 40,000 subscribers. The server didn't just get slow this time — it fell over. Nginx started dropping connections. The page wouldn't load at all.</p>
      <p>I stared at htop for an hour trying to figure out what was happening. The CPU wasn't maxed. The RAM wasn't full. But something was wrong. Eventually I figured it out: I was running out of <em>network bandwidth</em>. My home internet upload speed was 10 Mbps, and the site was maxing it out.</p>
      <p>No amount of RAM was going to fix that.</p>
      <h2>Vertical vs horizontal</h2>
      <p>This is the moment I learned the most important lesson in scaling: you can only make one computer so strong. Eventually something bottlenecks — CPU, memory, disk, network — and adding more of the other resources doesn't help. The industry calls this "vertical scaling" and it has a ceiling.</p>
      <p>The alternative is "horizontal scaling": instead of making one computer stronger, you add more computers. Each takes part of the load. No single bottleneck brings the whole thing down.</p>
      <p>I needed more than one computer.</p>
    `
  },
  {
    id: 3,
    title: "Two Servers, One Website",
    date: "July 22, 2025",
    category: "Distributed Systems",
    summary: "I bought a second Dell off Facebook Marketplace and put a load balancer in front of both of them. Now my blog was a system, not a machine. That's a bigger leap than it sounds.",
    body: `
      <p>After the Christmas incident I started shopping. I found a nearly identical Dell Optiplex on Facebook Marketplace for $75. I brought it home, set it up next to the first one, and installed the exact same software stack.</p>
      <p>Now I had two web servers. But how do you make a domain point to two computers?</p>
      <h2>Enter the load balancer</h2>
      <p>A load balancer is exactly what it sounds like. It's a piece of software (or hardware) that sits in front of your servers and distributes incoming requests across them. Think of it as a traffic cop at an intersection — when a request comes in, the load balancer decides which server gets it.</p>
      <p>I set up nginx on a third, much smaller machine — a Raspberry Pi, actually — configured as a load balancer. My domain pointed at the Pi. The Pi forwarded each request to either Server 1 or Server 2, alternating between them. If one server got overloaded, the Pi would notice and send more traffic to the other.</p>
      <p>Suddenly, my capacity doubled. When traffic spiked, the load was spread across two machines. Neither one was the bottleneck.</p>
      <h2>New problems I didn't expect</h2>
      <p>Running one server is hard. Running two is surprisingly more than twice as hard. When I update a blog post, I have to make sure both servers have the new file. When I tweak the nginx config, I have to do it in two places. If the servers drift out of sync, visitors get different content depending on which machine they hit.</p>
      <p>I wrote a shell script to rsync files between the machines. It worked 90% of the time. The other 10% was a fun mystery to debug.</p>
      <p>My home office now had three machines humming away in it. My wife, reasonably, asked if this was a phase.</p>
      <p>It was not a phase. It was about to get worse.</p>
    `
  },
  {
    id: 4,
    title: "Comcast Went Down and Took My Blog With It",
    date: "December 3, 2025",
    category: "Reliability",
    summary: "Two servers is great protection against one server failing. It's no protection at all against your ISP going down. I learned that the hard way — then I drove to St. Louis with two servers in my trunk.",
    body: `
      <p>The week of Thanksgiving I had written a post about home lab security that was doing well. I was watching the stats climb, feeling good about my two-server setup handling the traffic without breaking a sweat.</p>
      <p>Then Comcast went down.</p>
      <p>Not just at my house. Regionally. A chunk of Memphis lost service for about six hours on a Tuesday afternoon. My two perfectly healthy servers, working exactly as designed, sat there with nobody able to reach them.</p>
      <h2>What I got wrong</h2>
      <p>I'd spent months thinking about server redundancy. What I hadn't thought about was the fact that both servers were connected to the same internet, through the same modem, through the same ISP, through the same regional network. From the outside, my "redundant" setup was exactly as fragile as a single server.</p>
      <p>The technical term for this is a <em>single point of failure</em>. I had several of them, and I'd completely missed it.</p>
      <h2>The St. Louis plan</h2>
      <p>My parents live in St. Louis. They have a different ISP, a different regional network, a different power grid. On Black Friday weekend I loaded two more Dells into my car and drove six hours north.</p>
      <p>I spent Thanksgiving afternoon setting up a second site at my parents' house. Two more web servers, another Raspberry Pi running nginx as a load balancer. At the DNS layer, my domain now resolves to two IP addresses — one in Memphis, one in St. Louis. When a visitor tries to reach me, they get routed to whichever location responds first.</p>
      <p>When Memphis goes down, St. Louis serves everything. When St. Louis goes down, Memphis does.</p>
      <p>I now had four servers across two cities running my personal blog. On the drive home I realized something uncomfortable: I wasn't running a blog anymore. I was accidentally running a tiny, poorly-managed data center.</p>
    `
  },
  {
    id: 5,
    title: "I'm Not Running a Data Center. I'm Running a Blog.",
    date: "March 20, 2026",
    category: "Cloud",
    summary: "I want to start selling mechanical keyboards. That means a real database, payment processing, and actual uptime guarantees. I finally admitted the obvious — I cannot keep doing this myself.",
    body: `
      <p>Last month I decided I wanted to sell mechanical keyboards on the side. Nothing big — just a small online shop for custom builds I'd been making in my garage. I started writing down what I'd need to add to my infrastructure.</p>
      <p>The list got long fast:</p>
      <ul>
        <li>A real database, replicated across Memphis and St. Louis so orders don't get lost</li>
        <li>Payment processing with PCI compliance (handling credit cards on a Dell under my desk is almost certainly illegal)</li>
        <li>Actual uptime — an online store going down for six hours costs real money, not just readers</li>
        <li>SSL certificates that auto-renew across four servers without me babysitting them</li>
        <li>DDoS protection (I'd never needed it for a blog, but a shop is a bigger target)</li>
        <li>Off-site backups I actually trust</li>
        <li>A way to deploy new code without taking the site down</li>
      </ul>
      <p>I looked at this list and did the math. Each item would take me a weekend to set up properly. Some would take two or three. And once set up, they'd need ongoing attention — patching, monitoring, fixing when they break at 3am.</p>
      <h2>The honest moment</h2>
      <p>Somewhere around item 4 I had an uncomfortable realization. I had spent the last two years building infrastructure for a blog that maybe 5,000 people a month actually read. I'd learned a lot. But I'd also spent a significant portion of my Thanksgiving setting up servers in my parents' basement instead of being with my family.</p>
      <p>I'm not a systems engineer. I'm a writer who likes computers. Every hour I spend fighting with nginx or debugging DNS propagation is an hour I'm not writing or building the shop.</p>
      <p>The cloud providers — AWS, Azure, Google — have teams of engineers whose entire job is solving the problems I've been stumbling through. Payment processing, database replication, DDoS protection, automatic SSL: they offer all of it as services you just plug into.</p>
      <h2>What's next</h2>
      <p>I'm migrating to AWS. The blog goes on S3 and CloudFront — the same idea as my home setup (files served from a cache close to the reader), except someone else runs the caches, and there are hundreds of them instead of four.</p>
      <p>The shop will run on EC2 with RDS for the database — virtualized versions of my Dells and a managed MySQL behind them. Everything gets defined in Terraform so it's reproducible.</p>
      <p>The four Dells are going into a closet. I'll keep one around for side projects.</p>
      <p>Next post: I'll walk through exactly what the migration looked like, and why the shop's architecture ended up the way it did.</p>
    `
  }
];

function renderHome() {
  return `
    <div class="container">
      <div class="hero">
        <div class="hero-avatar">👩‍💻</div>
        <div>
          <h2>Hey, I'm Sally.</h2>
          <p>Software developer. Cloud architecture enthusiast. I write about things I've learned building systems at scale — and the mistakes that taught me the most.</p>
        </div>
      </div>
      <p class="section-title">Recent Posts</p>
      <div class="post-list">
        ${posts.map(p => `
          <a class="post-card" href="#/post/${p.id}">
            <div class="post-meta">
              <span class="post-category">${p.category}</span>
              <span class="post-date">${p.date}</span>
            </div>
            <h3>${p.title}</h3>
            <p>${p.summary}</p>
            <span class="read-more">Read more →</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

function renderPost(id) {
  const post = posts.find(p => p.id === parseInt(id));
  if (!post) return renderNotFound();
  return `
    <div class="container">
      <div class="post-detail">
        <button class="back-btn" onclick="navigate('/')">← Back to posts</button>
        <div class="post-meta">
          <span class="post-category">${post.category}</span>
          <span class="post-date">${post.date}</span>
        </div>
        <h1>${post.title}</h1>
        <div class="post-body">${post.body}</div>
      </div>
    </div>
  `;
}

function renderAbout() {
  return `
    <div class="container">
      <div class="about-card">
        <div class="hero-avatar" style="margin-bottom:1rem;font-size:3rem">👩‍💻</div>
        <h2>About Sally</h2>
        <p>I'm a software developer with a focus on cloud infrastructure and enterprise architecture. I've spent the last five years helping companies migrate to and operate workloads on AWS and Azure.</p>
        <p>This blog is where I write about what I'm learning — usually things I wish I'd read before I made the mistake myself.</p>
        <p>When I'm not writing Terraform or arguing about subnet sizing, I'm hiking, reading sci-fi, and perfecting my pour-over technique.</p>
        <div class="social-links">
          <a href="#">GitHub</a>
          <a href="#">LinkedIn</a>
          <a href="#">Twitter</a>
        </div>
      </div>
    </div>
  `;
}

function renderNotFound() {
  return `<div class="container"><div class="about-card"><h2>404</h2><p>Page not found.</p></div></div>`;
}

function navigate(path) {
  window.location.hash = path === '/' ? '/' : path;
}

function render() {
  const hash = window.location.hash.replace('#', '') || '/';
  const app = document.getElementById('app');

  if (hash === '/' || hash === '') {
    app.innerHTML = renderHome();
  } else if (hash === '/about') {
    app.innerHTML = renderAbout();
  } else if (hash.startsWith('/post/')) {
    const id = hash.split('/post/')[1];
    app.innerHTML = renderPost(id);
  } else {
    app.innerHTML = renderNotFound();
  }

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + hash);
  });
}

window.addEventListener('hashchange', render);
render();
