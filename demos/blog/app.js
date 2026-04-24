const posts = [
  {
    id: 1,
    title: "Why I Moved My Personal Site to the Cloud",
    date: "April 10, 2026",
    category: "Cloud",
    summary: "Six months ago I was paying $5/month for a shared host with 99.1% uptime (the 0.9% always happened during demos). Here's what changed.",
    body: `
      <p>For years my personal site lived on a shared hosting plan. It cost $5/month, went down occasionally, and I had exactly zero visibility into why. Then I started learning cloud architecture at work and thought: <em>I should practice what I preach.</em></p>
      <h2>The Setup</h2>
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
