const posts = [
  {
    id: 1,
    title: "The Day My Blog Crashed and 3,000 People Saw It",
    date: "September 4, 2025",
    category: "Scaling",
    summary: "I wrote a post that made it to the front page of Hacker News. My $6/month shared host lasted exactly 11 minutes. Here's what happened.",
    body: `
      <p>I'd been writing this blog for two years. My biggest day before this was 84 visitors. I wrote mostly for myself — a way to think out loud about things I was learning at work.</p>
      <p>Then on a Tuesday afternoon I posted something about a weird PostgreSQL bug I'd spent three days tracking down. By 6pm it was on the front page of Hacker News.</p>
      <h2>11 minutes</h2>
      <p>That's how long my site stayed up. I watched the visitor counter climb — 200, 400, 900 — and then nothing. A white page. An error I'd never seen before: <strong>508 Resource Limit Reached</strong>.</p>
      <p>My hosting provider sent me an email 40 minutes later explaining that my account had "exceeded the CPU and memory allocation for the shared plan" and had been automatically suspended to protect other users on the same server.</p>
      <p>Other users on the same server. That was the first time I really understood what "shared hosting" meant. My blog wasn't running on its own — it was one of probably hundreds of sites crammed onto a single physical machine, all competing for the same resources. When I needed more, there wasn't any to give me.</p>
      <h2>The cost of downtime</h2>
      <p>3,000 people tried to visit that day. Most of them saw an error. A few left comments on the HN thread asking if my site was down. One person said they'd bookmarked it to read later. I'll never know how many just closed the tab and moved on.</p>
      <p>I don't run a business off this blog. But that day I understood, for the first time, why uptime actually matters — and why the companies I work with obsess over it.</p>
      <p>I started Googling "how to host a website that doesn't go down" the same night.</p>
    `
  },
  {
    id: 2,
    title: "I Called My Hosting Company. It Did Not Go Well.",
    date: "September 12, 2025",
    category: "Scaling",
    summary: "After the crash I wanted answers. I got a sales pitch for a dedicated server at $199/month and a lesson in why shared hosting is designed to fail at scale.",
    body: `
      <p>A week after the crash I called my hosting provider. I wanted to understand what had happened and what my options were. The conversation lasted 22 minutes and left me more frustrated than when I started.</p>
      <h2>What they offered me</h2>
      <p>The support rep was perfectly nice. He explained that shared hosting — my $6/month plan — was designed for sites with "low to moderate traffic." When I asked what that meant in numbers, he said "typically under a few hundred visitors per day."</p>
      <p>My options, as presented to me:</p>
      <ul>
        <li><strong>Stay on shared hosting</strong> — accept the limitations, hope it doesn't happen again</li>
        <li><strong>Upgrade to VPS</strong> — $40/month for a virtual private server with dedicated resources. Better, but still a fixed ceiling.</li>
        <li><strong>Dedicated server</strong> — $199/month for a physical machine that's entirely mine</li>
      </ul>
      <p>None of these felt right. The shared plan had already proven it couldn't handle a spike. The VPS would handle more — but what if I had another big day? Would I just hit a different ceiling? And $199/month for a personal blog felt absurd.</p>
      <h2>The thing that stuck with me</h2>
      <p>I asked him: "Is there a plan where I only pay for what I actually use?" He paused, then said: "Not really, no. We bill monthly regardless of traffic."</p>
      <p>I thanked him and hung up. Then I opened a new browser tab and searched for "AWS."</p>
      <p>I'd heard the name at work constantly. We ran most of our company's infrastructure on it. I'd always assumed it was too complicated for a personal project. Turns out I was wrong about that.</p>
    `
  },
  {
    id: 3,
    title: "What I Learned in Three Weekends of Cloud Research",
    date: "October 1, 2025",
    category: "Cloud",
    summary: "VPS, CDN, S3, CloudFront, serverless — I had to learn a lot of new words before I could make a decision. Here's what actually matters for a simple blog.",
    body: `
      <p>I gave myself three weekends to figure out cloud hosting before committing to anything. I read a lot, watched some videos, and broke several things in AWS free tier accounts. Here's what I came away with.</p>
      <h2>The key insight: not all traffic is equal</h2>
      <p>My blog is static. The HTML, CSS, and JavaScript files don't change between visits — every reader gets the exact same files. There's no database query, no login, no user-specific content. It's just files.</p>
      <p>This matters enormously for hosting, because there's a class of infrastructure built specifically for serving files — and it's extremely good at it.</p>
      <h2>S3 + CloudFront</h2>
      <p>Amazon S3 is object storage. You put files in, people get files out. It doesn't run code — it just stores things. But crucially, it can serve those files to the public as a website.</p>
      <p>CloudFront is Amazon's Content Delivery Network (CDN). It takes your files from S3 and caches copies of them at edge locations around the world — data centers close to your readers. When someone in Memphis loads my blog, they're not fetching files from a server in Virginia. They're getting them from wherever is closest to them.</p>
      <p>The combination of the two means:</p>
      <ul>
        <li>There's no single server that can be overwhelmed — requests are distributed across dozens of edge locations</li>
        <li>I'm billed per request and per gigabyte of data transferred, not per month regardless of usage</li>
        <li>My 3,000-visitor HN day would have cost me about $0.04</li>
      </ul>
      <h2>What I didn't need</h2>
      <p>I spent a weekend looking at containerization, serverless functions, and load balancers before I realized: my blog doesn't need any of that. It's just files. The temptation to over-engineer is real — AWS has hundreds of services and it's easy to convince yourself you need more than you do.</p>
      <p>Start with the simplest thing that solves your actual problem. For a static blog, that's S3 and CloudFront.</p>
    `
  },
  {
    id: 4,
    title: "Six Months on AWS: What I Wish I'd Known",
    date: "March 20, 2026",
    category: "Cloud",
    summary: "My blog has been on AWS since October. My highest bill was $0.87. Here's an honest look at what's great, what's annoying, and what I'd tell myself six months ago.",
    body: `
      <p>Six months ago I moved this blog from a $6/month shared host to AWS S3 + CloudFront. Since then I've had two more traffic spikes, zero downtime, and my highest monthly AWS bill was $0.87.</p>
      <p>Here's what I actually think about it now that the novelty has worn off.</p>
      <h2>What's genuinely great</h2>
      <p><strong>It scales automatically and I never think about it.</strong> When a post gets shared and traffic spikes, nothing happens on my end. The site just... handles it. CloudFront distributes the load across its global edge network and I find out about the traffic from my analytics the next morning.</p>
      <p><strong>The cost model makes sense.</strong> I pay for what I use. In a quiet month that's a few cents. After a traffic spike it might be a dollar. There's no $6 charge for a month where I posted nothing.</p>
      <p><strong>I understand my infrastructure.</strong> The entire thing is defined in a Terraform file — about 60 lines of code. I can read exactly what exists, why, and how it fits together. When something seems wrong, I have somewhere to look.</p>
      <h2>What's annoying</h2>
      <p><strong>The learning curve is real.</strong> I spent three weekends on research before I was confident enough to deploy anything. AWS has a lot of surface area and the documentation assumes you already know what you're looking for.</p>
      <p><strong>IAM will humble you.</strong> Identity and Access Management — the permission system — is powerful and confusing. I accidentally made my S3 bucket public twice before I understood the difference between bucket policies and ACLs.</p>
      <h2>What I'd tell myself six months ago</h2>
      <p>The thing I was most wrong about was thinking this was too complicated for a personal project. It's not. The concepts are learnable. The tools have gotten better. And once it's set up, it genuinely requires less ongoing attention than my old shared host did.</p>
      <p>If your site is static and you care about it staying up, move it to S3 and CloudFront. The worst outcome is you spend a weekend learning something useful.</p>
    `
  }
];
      <p>I moved everything to an S3 bucket with a CloudFront distribution in front of it. Total cost? Around $0.50/month. Uptime? 100% — because S3 is basically indestructible.</p>
      <ul>
        <li>S3 stores the static files (HTML, CSS, JS)</li>
        <li>CloudFront caches and serves them from edge locations worldwide</li>
        <li>Route 53 handles DNS</li>
        <li>ACM gives me a free TLS certificate</li>
      </ul>
      <h2>What I Learned</h2>
      <p>The hardest part was not the infrastructure — it was changing how I thought about deployments. On shared hosting, I'd FTP files up. Now I run <code>terraform apply</code> and everything just works.</p>
      <p>If you're a developer who hasn't tried hosting something on the cloud yourself, start here. It's the fastest way to understand what your ops team deals with every day.</p>
    `
  },
  {
    id: 2,
    title: "VPCs Explained Like You're a Developer, Not a Network Engineer",
    date: "March 28, 2026",
    category: "Networking",
    summary: "Virtual Private Clouds sound scary. They're just a private section of the cloud with its own networking rules. Here's a mental model that actually stuck for me.",
    body: `
      <p>When I first encountered VPCs, I thought I needed a CCNA to understand them. I didn't. Here's the mental model that finally made it click.</p>
      <h2>Think of It Like an Office Building</h2>
      <p>A VPC is your entire office building. You own it — nobody else can get in without your permission.</p>
      <ul>
        <li><strong>Subnets</strong> are floors of the building. Public subnets face the street (internet-accessible). Private subnets are interior floors — you need to be inside to reach them.</li>
        <li><strong>Security Groups</strong> are door locks on individual rooms. You decide who can knock and who can enter.</li>
        <li><strong>The Internet Gateway</strong> is the front door of the building.</li>
        <li><strong>NAT Gateway</strong> is the mail room — interior floors can send packages out, but nobody outside can initiate contact with them directly.</li>
      </ul>
      <h2>Why It Matters for Enterprise Architecture</h2>
      <p>In a well-designed enterprise architecture, your database never lives in a public subnet. It sits in a private subnet, accessible only from your application servers. This is the difference between a deadbolt on the front door and a bank vault inside the building.</p>
      <p>Once you internalize this model, reading Terraform networking code becomes much more natural.</p>
    `
  },
  {
    id: 3,
    title: "Infrastructure as Code: My First Month with Terraform",
    date: "March 5, 2026",
    category: "IaC",
    summary: "I went from clicking around the AWS console to declaring everything in code. Here's what surprised me, what frustrated me, and why I'm never going back.",
    body: `
      <p>I used to live in the AWS console. Click, click, click — and then spend three hours trying to remember what I clicked when something broke at 2am. Terraform changed that.</p>
      <h2>The Biggest Mental Shift</h2>
      <p>Infrastructure as Code means your infrastructure is <em>declarative</em>. You describe the desired end state and Terraform figures out how to get there. You don't say "create a subnet then attach it to the route table" — you say "I want a subnet and I want it in this route table" and Terraform figures out the order.</p>
      <h2>What Frustrated Me</h2>
      <ul>
        <li>State management. If Terraform's state file gets out of sync with reality, things get weird fast.</li>
        <li>Provider version pinning. Always pin your provider versions. I learned this the hard way.</li>
        <li><code>terraform destroy</code> is permanent. There's no undo.</li>
      </ul>
      <h2>What I Love</h2>
      <p>The best part is <code>terraform plan</code>. Before changing anything, Terraform tells you exactly what it's going to do. It's like a diff for your infrastructure. I wish the AWS console had this.</p>
      <p>The second best part: I can spin up a complete multi-tier environment in under 10 minutes and tear it down just as fast. For demos, that's magic.</p>
    `
  },
  {
    id: 4,
    title: "Multi-Cloud Isn't a Strategy — It's a Consequence",
    date: "February 18, 2026",
    category: "Strategy",
    summary: "Every company says they want multi-cloud. Most of them don't know why. Here's my take after working across AWS and Azure for the past two years.",
    body: `
      <p>I've had this conversation dozens of times: a stakeholder says "we need to be multi-cloud" and when you ask why, you get answers like "avoid vendor lock-in" or "resilience." These are real concerns. But multi-cloud is rarely the right solution for them.</p>
      <h2>Vendor Lock-In Is Real, But...</h2>
      <p>True vendor lock-in happens at the service layer, not the infrastructure layer. If you're using DynamoDB, you're locked into AWS. If you're using RDS MySQL on a standard t3.micro, switching clouds is annoying but not catastrophic.</p>
      <p>The solution to lock-in is abstraction layers — containers, Terraform, managed Kubernetes. Not running identical stacks on two clouds simultaneously.</p>
      <h2>When Multi-Cloud Actually Makes Sense</h2>
      <ul>
        <li>You acquired a company that runs on a different cloud</li>
        <li>You have regulatory requirements mandating geographic distribution across providers</li>
        <li>Different teams have genuine expertise in different platforms</li>
        <li>You're running a PaaS and offering your customers cloud choice</li>
      </ul>
      <h2>The Real Cost</h2>
      <p>Running the same workload on two clouds doesn't double your reliability — it doubles your operational complexity. Every runbook, every monitoring dashboard, every on-call rotation now has two versions. Be intentional about that tradeoff.</p>
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
