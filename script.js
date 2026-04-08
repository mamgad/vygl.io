// ─── Theme toggle ───
const themeToggle = document.getElementById('theme-toggle');
const savedTheme = localStorage.getItem('vygl_landing_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vygl_landing_theme', next);
});

// ─── Navbar scroll effect ───
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// ─── Mobile menu toggle ───
const menuBtn = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');

menuBtn.addEventListener('click', () => {
  mobileNav.classList.toggle('open');
});

// Close mobile nav on link click
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
  });
});

// ─── Scroll reveal (IntersectionObserver) ───
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px',
});

revealElements.forEach(el => revealObserver.observe(el));

// ─── Editor tab switching ───
const editorTabs = document.querySelectorAll('.editor-tab');
const editorPanels = document.querySelectorAll('.editor-panel');
const findingsPanels = document.querySelectorAll('.findings-panel-inner');
let autoRotateTimer = null;
let userInteracted = false;

function switchToTab(idx) {
  // Switch active tab
  editorTabs.forEach(t => t.classList.remove('active', 'tab-nudge'));
  const targetTab = document.querySelector(`.editor-tab[data-tab="${idx}"]`);
  if (targetTab) targetTab.classList.add('active');

  // Switch active code panel
  editorPanels.forEach(p => p.classList.remove('active'));
  const activePanel = document.querySelector(`.editor-panel[data-panel="${idx}"]`);
  if (activePanel) activePanel.classList.add('active');

  // Switch active findings panel and re-trigger animations
  findingsPanels.forEach(fp => {
    fp.classList.remove('active');
    fp.querySelectorAll('.anim-tag').forEach(a => {
      a.style.animation = 'none';
      a.offsetHeight;
      a.style.animation = '';
    });
  });
  const activeFP = document.querySelector(`.findings-panel-inner[data-findings="${idx}"]`);
  if (activeFP) activeFP.classList.add('active');

  // Nudge the next tab after a pause
  if (!userInteracted) {
    const nextIdx = (parseInt(idx) + 1) % editorTabs.length;
    const nextTab = document.querySelector(`.editor-tab[data-tab="${nextIdx}"]`);
    if (nextTab) {
      setTimeout(() => nextTab.classList.add('tab-nudge'), 2500);
    }
  }
}

// Manual click
editorTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    userInteracted = true;
    clearInterval(autoRotateTimer);
    editorTabs.forEach(t => t.classList.remove('tab-nudge'));
    switchToTab(tab.dataset.tab);
  });
});

// Auto-rotate every 5s, stop on user click
function startAutoRotate() {
  let current = 0;
  // Nudge the second tab after initial delay
  setTimeout(() => {
    const secondTab = document.querySelector('.editor-tab[data-tab="1"]');
    if (secondTab && !userInteracted) secondTab.classList.add('tab-nudge');
  }, 3000);

  autoRotateTimer = setInterval(() => {
    if (userInteracted) { clearInterval(autoRotateTimer); return; }
    current = (current + 1) % editorTabs.length;
    switchToTab(current);
  }, 5000);
}

startAutoRotate();

// ─── Align finding rows to code lines ───
function alignFindings() {
  const isSmall = window.innerWidth <= 1024;
  document.querySelectorAll('.fp-row[data-line]').forEach(row => {
    if (isSmall) {
      row.style.top = '';
      return;
    }
    const panelIdx = row.closest('.findings-panel-inner').dataset.findings;
    const editorPanel = document.querySelector(`.editor-panel[data-panel="${panelIdx}"]`);
    if (!editorPanel) return;
    const lines = editorPanel.querySelectorAll('.code-line');
    const lineIdx = parseInt(row.dataset.line);
    const targetLine = lines[lineIdx];
    if (!targetLine) return;

    // Get the offset of the code line relative to the scan-demo-layout container
    const container = row.closest('.scan-demo-layout');
    const containerRect = container.getBoundingClientRect();
    const lineRect = targetLine.getBoundingClientRect();
    const rowHeight = row.offsetHeight;

    // Center the finding row vertically on the code line
    row.style.top = (lineRect.top - containerRect.top + (lineRect.height - rowHeight) / 2) + 'px';
  });
}

// Run on load, resize, and tab switch
alignFindings();
window.addEventListener('resize', alignFindings);

// Patch switchToTab to also re-align
const origSwitch = switchToTab;
switchToTab = function(idx) {
  origSwitch(idx);
  requestAnimationFrame(() => requestAnimationFrame(alignFindings));
};

// ─── Smooth scroll for anchor links ───
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── CLI output animation ───
const cliLines = [
  { text: '<span class="t-prompt">$</span> <span class="t-cmd">docker run --rm -v $(pwd):/src vygl-scanner \\</span>', delay: 0 },
  { text: '    <span class="t-cmd">--scan-types sast,sca,secrets,iac /src</span>', delay: 200 },
  { text: '', delay: 400 },
  { text: '<span class="t-muted">──────────────────────────── Vygl Security Scan ────────────────────────────</span>', delay: 500 },
  { text: '', delay: 100 },
  { text: '  <span class="t-muted">Path:</span>       <span class="t-white">/src</span>', delay: 200 },
  { text: '  <span class="t-muted">Scan types:</span> sast, sca, secrets, iac', delay: 150 },
  { text: '  <span class="t-muted">Branch:</span>     <span class="t-white">main</span> <span class="t-muted">(commit: e4f7a21b)</span>', delay: 150 },
  { text: '  <span class="t-muted">Project:</span>    <span class="t-white t-bold">acme-api</span> <span class="t-muted">(a1b2c3d4...)</span>', delay: 150 },
  { text: '', delay: 400 },
  { text: '  Running <span class="t-purple">SAST</span> engine...', delay: 600 },
  { text: '    Found <span class="t-white t-bold">3</span> findings', delay: 500 },
  { text: '  Running <span class="t-cyan">SCA</span> engine...', delay: 600 },
  { text: '    Found <span class="t-white t-bold">5</span> findings, <span class="t-white t-bold">47</span> dependencies', delay: 500 },
  { text: '  Running <span class="t-red">Secrets</span> engine...', delay: 600 },
  { text: '    Found <span class="t-white t-bold">1</span> finding', delay: 500 },
  { text: '  Running <span class="t-emerald">IaC</span> engine...', delay: 600 },
  { text: '    Found <span class="t-white t-bold">2</span> findings', delay: 500 },
  { text: '', delay: 300 },
  { text: '<span class="t-muted">──────────────────────────── 11 findings ────────────────────────────────────</span>', delay: 400 },
  { text: '  <span class="t-red t-bold">2 CRITICAL</span> · <span class="t-orange">3 HIGH</span> · <span class="t-yellow">4 MEDIUM</span> · <span class="t-blue">2 LOW</span>', delay: 300 },
  { text: '  <span class="t-muted">3 sast · 5 sca · 1 secrets · 2 iac</span>', delay: 200 },
  { text: '  <span class="t-muted">47 dependencies detected</span>', delay: 200 },
  { text: '', delay: 200 },
  { text: '  <span class="t-red">●</span> CRITICAL  <span class="t-white">sql-injection-fstring</span>                    <span class="t-muted">src/db.py:42</span>', delay: 250 },
  { text: '  <span class="t-red">●</span> CRITICAL  <span class="t-white">log4j-core-CVE-2021-44228</span>                <span class="t-muted">pom.xml:7</span>', delay: 250 },
  { text: '  <span class="t-orange">●</span> HIGH      <span class="t-white">hardcoded-api-key</span>                        <span class="t-muted">config.py:6</span>', delay: 250 },
  { text: '  <span class="t-orange">●</span> HIGH      <span class="t-white">os-command-injection</span>                     <span class="t-muted">server.py:11</span>', delay: 250 },
  { text: '  <span class="t-orange">●</span> HIGH      <span class="t-white">s3-bucket-public-access</span>                  <span class="t-muted">main.tf:6</span>', delay: 250 },
  { text: '  <span class="t-yellow">●</span> MEDIUM    <span class="t-white">jackson-CVE-2019-12384</span>                   <span class="t-muted">pom.xml:12</span>', delay: 250 },
  { text: '  <span class="t-yellow">●</span> MEDIUM    <span class="t-white">unrestricted-ingress</span>                     <span class="t-muted">main.tf:13</span>', delay: 250 },
  { text: '  <span class="t-muted">... and 4 more findings</span>', delay: 200 },
  { text: '', delay: 300 },
  { text: '  <span class="t-green">✓</span> Results pushed to Vygl Cloud <span class="t-muted">(scan: e4f7a21b3c9d)</span>', delay: 400 },
  { text: '', delay: 200 },
  { text: '<span class="t-muted">───────────────────────────────── PASSED ─────────────────────────────────────</span>', delay: 400 },
];

let cliAnimated = false;
const cliOutput = document.getElementById('cli-output');

function runCliAnimation() {
  if (cliAnimated) return;
  cliAnimated = true;

  const pre = document.createElement('pre');
  cliOutput.appendChild(pre);

  let totalDelay = 0;
  cliLines.forEach((line) => {
    totalDelay += line.delay;
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'cli-line';
      div.innerHTML = line.text || '&nbsp;';
      pre.appendChild(div);
      // Auto-scroll to bottom
      cliOutput.scrollTop = cliOutput.scrollHeight;
    }, totalDelay);
  });

  // Loop: reset and replay after all lines + pause
  setTimeout(() => {
    cliAnimated = false;
    pre.remove();
    runCliAnimation();
  }, totalDelay + 4000);
}

// Start animation when terminal scrolls into view
const terminalEl = document.querySelector('.terminal');
if (terminalEl) {
  const termObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      runCliAnimation();
      termObserver.unobserve(terminalEl);
    }
  }, { threshold: 0.3 });
  termObserver.observe(terminalEl);
}

// ─── AI Verification Demo ───
const aiDemoCard = document.getElementById('ai-demo-card');

if (aiDemoCard) {
  const stateIdle = document.getElementById('ai-state-idle');
  const stateLoading = document.getElementById('ai-state-loading');
  const stateResult = document.getElementById('ai-state-result');
  const verifyBtn = document.getElementById('ai-verify-btn');
  const reasoningEl = document.getElementById('ai-reasoning');
  const verdictBadge = document.getElementById('ai-verdict-badge');
  const confidenceEl = document.getElementById('ai-confidence');
  const fixSection = document.getElementById('ai-fix-section');
  const fixCode = document.getElementById('ai-fix-code');
  const resultFooter = document.getElementById('ai-result-footer');

  const reasoningText = 'This is a <code>true positive</code>. The user-supplied query parameter from <code>request.GET.get("q")</code> is directly interpolated into a raw SQL string via an f-string, then passed to <code>User.objects.raw()</code>. An attacker can inject arbitrary SQL — for example, passing <code>q=\' OR 1=1 --</code> would return all users. Django\'s ORM parameterization is completely bypassed here.';

  const fixLines = [
    '<span class="t-purple">def </span><span class="t-blue">search_users</span>(request):',
    '    query = request.GET.get(<span class="t-emerald">"q"</span>, <span class="t-emerald">""</span>)',
    '    users = User.objects.filter(',
    '        name__icontains=query',
    '    )',
    '    <span class="t-purple">return</span> JsonResponse({<span class="t-emerald">"users"</span>: list(users)})',
  ];

  let aiAnimating = false;

  function streamText(el, html, speed, callback) {
    // Parse HTML into segments: tags (rendered instantly) and text (streamed char by char)
    const segments = [];
    const tagRe = /<[^>]+>/g;
    let lastIdx = 0;
    let match;
    while ((match = tagRe.exec(html)) !== null) {
      if (match.index > lastIdx) {
        segments.push({ type: 'text', content: html.slice(lastIdx, match.index) });
      }
      segments.push({ type: 'tag', content: match[0] });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < html.length) {
      segments.push({ type: 'text', content: html.slice(lastIdx) });
    }

    let rendered = '';
    let segIdx = 0;
    let charIdx = 0;

    function tick() {
      if (segIdx >= segments.length) {
        el.innerHTML = rendered;
        if (callback) callback();
        return;
      }
      const seg = segments[segIdx];
      if (seg.type === 'tag') {
        rendered += seg.content;
        segIdx++;
        tick();
        return;
      }
      // Stream text char by char
      if (charIdx < seg.content.length) {
        rendered += seg.content[charIdx];
        charIdx++;
        el.innerHTML = rendered + '<span class="ai-cursor"></span>';
        setTimeout(tick, speed);
      } else {
        segIdx++;
        charIdx = 0;
        tick();
      }
    }
    tick();
  }

  function runAIDemo() {
    if (aiAnimating) return;
    aiAnimating = true;

    // Show loading
    stateIdle.style.display = 'none';
    stateLoading.style.display = 'flex';
    stateResult.style.display = 'none';

    setTimeout(() => {
      // Show result container
      stateLoading.style.display = 'none';
      stateResult.style.display = 'flex';
      reasoningEl.innerHTML = '';
      fixSection.style.display = 'none';
      fixCode.innerHTML = '';
      resultFooter.style.display = 'none';
      verdictBadge.classList.remove('visible');
      confidenceEl.classList.remove('visible');

      // Animate verdict badge
      setTimeout(() => verdictBadge.classList.add('visible'), 200);
      setTimeout(() => confidenceEl.classList.add('visible'), 500);

      // Stream reasoning text
      setTimeout(() => {
        streamText(reasoningEl, reasoningText, 18, () => {
          // Show fix after reasoning completes
          setTimeout(() => {
            fixSection.style.display = 'block';
            // Stream fix lines one by one
            let lineIdx = 0;
            function addFixLine() {
              if (lineIdx >= fixLines.length) {
                // Show footer
                setTimeout(() => {
                  resultFooter.style.display = 'block';
                  // Reset after pause
                  setTimeout(() => {
                    aiAnimating = false;
                    stateResult.style.display = 'none';
                    stateIdle.style.display = 'flex';
                    verdictBadge.classList.remove('visible');
                    confidenceEl.classList.remove('visible');
                  }, 5000);
                }, 400);
                return;
              }
              const div = document.createElement('div');
              div.innerHTML = fixLines[lineIdx];
              div.style.animation = 'cli-fade-in 0.15s ease-out both';
              fixCode.appendChild(div);
              lineIdx++;
              setTimeout(addFixLine, 100);
            }
            addFixLine();
          }, 400);
        });
      }, 800);
    }, 1500);
  }

  // Button click triggers demo
  verifyBtn.addEventListener('click', runAIDemo);

  // Auto-trigger when scrolled into view
  const aiDemoSection = document.querySelector('.ai-demo-section');
  if (aiDemoSection) {
    const aiObserver = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setTimeout(runAIDemo, 600);
        aiObserver.unobserve(aiDemoSection);
      }
    }, { threshold: 0.4 });
    aiObserver.observe(aiDemoSection);
  }
}

// ─── AI Consultation Demo ───
const consultSection = document.querySelector('.ai-consult-section');
const consultIdle = document.getElementById('ai-consult-idle');
const consultLoading = document.getElementById('ai-consult-loading');
const consultResult = document.getElementById('ai-consult-result');
const consultBtn = document.getElementById('ai-consult-btn');

if (consultSection && consultIdle && consultLoading && consultResult && consultBtn) {
  let consultAnimating = false;

  // Reuse the streamText function pattern from the AI demo
  function streamConsultText(el, html, speed, callback) {
    const segments = [];
    const tagRe = /<[^>]+>/g;
    let lastIdx = 0;
    let match;
    while ((match = tagRe.exec(html)) !== null) {
      if (match.index > lastIdx) {
        segments.push({ type: 'text', content: html.slice(lastIdx, match.index) });
      }
      segments.push({ type: 'tag', content: match[0] });
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < html.length) {
      segments.push({ type: 'text', content: html.slice(lastIdx) });
    }

    let rendered = '';
    let segIdx = 0;
    let charIdx = 0;

    function tick() {
      if (segIdx >= segments.length) {
        el.innerHTML = rendered;
        if (callback) callback();
        return;
      }
      const seg = segments[segIdx];
      if (seg.type === 'tag') {
        rendered += seg.content;
        segIdx++;
        tick();
        return;
      }
      if (charIdx < seg.content.length) {
        rendered += seg.content[charIdx];
        charIdx++;
        el.innerHTML = rendered + '<span class="ai-cursor"></span>';
        setTimeout(tick, speed);
      } else {
        segIdx++;
        charIdx = 0;
        tick();
      }
    }
    tick();
  }

  const execSummaryHTML = '<strong>Moderate risk.</strong> 47 open findings across 4 scan types. Two critical issues: SQL injection in <code>backend/views/users.py</code> and Log4Shell in <code>log4j-core 2.14.1</code>. AI triage cleared 9 false positives from secrets detection. Remaining medium-severity IaC findings can be batch-resolved.';

  function runConsultDemo() {
    if (consultAnimating) return;
    consultAnimating = true;

    // Show loading skeleton
    consultIdle.style.display = 'none';
    consultLoading.style.display = 'flex';
    consultResult.style.display = 'none';

    // Hide all cards and reset exec summary
    const cards = consultResult.querySelectorAll('.ai-consult-card');
    cards.forEach(c => c.classList.remove('visible'));
    const execText = document.getElementById('ai-consult-exec-text');

    setTimeout(function() {
      // Show result container
      consultLoading.style.display = 'none';
      consultResult.style.display = 'flex';

      // Lock exec summary height before clearing so streaming doesn't cause layout shift
      if (execText) {
        execText.dataset.originalHtml = execText.dataset.originalHtml || execText.innerHTML;
        execText.style.minHeight = execText.scrollHeight + 'px';
        execText.innerHTML = '';
      }

      // Stagger card reveals
      cards.forEach(function(card, i) {
        setTimeout(function() {
          card.classList.add('visible');

          // Stream text for first card (executive summary)
          if (i === 0 && execText) {
            setTimeout(function() {
              streamConsultText(execText, execSummaryHTML, 12, null);
            }, 200);
          }
        }, i * 400);
      });

      // Loop: reset after all cards visible + reading pause
      var totalTime = (cards.length * 400) + (execSummaryHTML.length * 12) + 6000;
      setTimeout(function() {
        consultAnimating = false;
        consultResult.style.display = 'none';
        consultIdle.style.display = 'flex';
        // Restore original exec summary for next run
        if (execText && execText.dataset.originalHtml) {
          execText.innerHTML = execText.dataset.originalHtml;
          execText.style.minHeight = '';
        }
      }, totalTime);
    }, 1800);
  }

  // Button click triggers demo
  consultBtn.addEventListener('click', runConsultDemo);

  // Auto-trigger when scrolled into view
  const consultObserver = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      setTimeout(runConsultDemo, 1000);
      consultObserver.unobserve(consultSection);
    }
  }, { threshold: 0.3 });
  consultObserver.observe(consultSection);
}

// ─── MCP IDE Demo ───
var mcpClaudeGen = 0;
var mcpCursorGen = 0;
var mcpClaudeAnimating = false;
var mcpCursorAnimating = false;
var mcpClaudeOutput = document.getElementById('mcp-claude-output');
var mcpCursorChat = document.getElementById('mcp-cursor-chat');

var mcpTabs = document.querySelectorAll('.mcp-tab');
var mcpPanels = document.querySelectorAll('.mcp-panel');

mcpTabs.forEach(function(tab) {
  tab.addEventListener('click', function() {
    var idx = tab.dataset.mcpTab;
    mcpTabs.forEach(function(t) { t.classList.remove('active'); });
    tab.classList.add('active');
    mcpPanels.forEach(function(p) { p.classList.remove('active'); });
    var panel = document.querySelector('.mcp-panel[data-mcp-panel="' + idx + '"]');
    if (panel) panel.classList.add('active');

    // Cancel old animations and start fresh
    mcpClaudeGen++;
    mcpCursorGen++;
    mcpClaudeAnimating = false;
    mcpCursorAnimating = false;
    if (mcpClaudeOutput) mcpClaudeOutput.innerHTML = '';
    if (mcpCursorChat) mcpCursorChat.innerHTML = '';

    if (idx === '0') runMcpClaudeDemo();
    if (idx === '1') runMcpCursorDemo();
  });
});

var mcpClaudeLines = [
  { text: '<span class="mcp-prompt">❯</span> <span class="t-white">what critical findings do we have in acme-api?</span>', delay: 0 },
  { text: '', delay: 300 },
  { text: '<span class="mcp-assistant">⏺</span> I\'ll search your security findings.', delay: 400 },
  { text: '', delay: 200 },
  { text: '  <span class="mcp-tool-call">vygl:search_findings</span><span class="t-muted">(project: </span><span class="t-emerald">"acme-api"</span><span class="t-muted">, severity: </span><span class="t-emerald">"critical"</span><span class="t-muted">)</span>', delay: 300 },
  { text: '', delay: 600 },
  { text: '  Found <span class="t-white t-bold">2</span> critical findings:', delay: 300 },
  { text: '', delay: 150 },
  { text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">SQL Injection via f-string</span>', delay: 250 },
  { text: '    <span class="t-purple">SAST</span> · <span class="t-muted">backend/views/users.py:42</span>', delay: 150 },
  { text: '', delay: 100 },
  { text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">Log4Shell CVE-2021-44228</span>', delay: 250 },
  { text: '    <span class="t-cyan">SCA</span> · <span class="t-muted">pom.xml:7 · log4j-core@2.14.1</span>', delay: 150 },
  { text: '', delay: 100 },
  { text: '  Both require immediate attention.', delay: 200 },
  { text: '', delay: 800 },
  { text: '<span class="mcp-prompt">❯</span> <span class="t-white">verify the SQL injection — is it a real issue?</span>', delay: 500 },
  { text: '', delay: 300 },
  { text: '<span class="mcp-assistant">⏺</span> Let me verify that with AI triage.', delay: 400 },
  { text: '', delay: 200 },
  { text: '  <span class="mcp-tool-call">vygl:ai_verify_finding</span><span class="t-muted">(finding_id: </span><span class="t-emerald">"sql-inj-a3e7f"</span><span class="t-muted">)</span>', delay: 300 },
  { text: '', delay: 800 },
  { text: '  <span class="t-green">✓</span> <span class="t-white t-bold">True Positive</span> · <span class="t-green">High confidence</span>', delay: 400 },
  { text: '', delay: 150 },
  { text: '  User input from <span class="t-orange">request.GET.get("q")</span> is directly', delay: 200 },
  { text: '  interpolated into raw SQL via f-string. An attacker', delay: 150 },
  { text: '  can inject arbitrary SQL.', delay: 150 },
  { text: '', delay: 200 },
  { text: '  <span class="t-muted">Suggested fix — use Django ORM:</span>', delay: 200 },
  { text: '', delay: 100 },
  { text: '    <span class="t-blue">users</span> = User.objects.filter(', delay: 100 },
  { text: '        name__icontains=query', delay: 100 },
  { text: '    )', delay: 100 },
];

function runMcpClaudeDemo() {
  if (mcpClaudeAnimating) return;
  mcpClaudeAnimating = true;
  var gen = ++mcpClaudeGen;

  if (mcpClaudeOutput) mcpClaudeOutput.innerHTML = '';
  var pre = document.createElement('pre');
  if (mcpClaudeOutput) mcpClaudeOutput.appendChild(pre);

  var totalDelay = 0;
  mcpClaudeLines.forEach(function(line) {
    totalDelay += line.delay;
    setTimeout(function() {
      if (gen !== mcpClaudeGen) return;
      var div = document.createElement('div');
      div.className = 'cli-line';
      div.innerHTML = line.text || '&nbsp;';
      pre.appendChild(div);
      if (mcpClaudeOutput) mcpClaudeOutput.scrollTop = mcpClaudeOutput.scrollHeight;
    }, totalDelay);
  });

  setTimeout(function() {
    if (gen !== mcpClaudeGen) return;
    mcpClaudeAnimating = false;
    pre.remove();
    runMcpClaudeDemo();
  }, totalDelay + 5000);
}

var mcpCursorMessages = [
  { type: 'user', html: 'What security findings do we have in this project?' },
  { type: 'tool', html: '<span class="mcp-tool-name">vygl:search_findings</span> <span class="mcp-tool-status">✓</span>' },
  { type: 'assistant', html: '<strong>47 findings</strong> across 4 scan types:<br><br><span class="t-red">● 2 critical</span> — SQL injection in <span class="t-orange">users.py:42</span>, Log4Shell in <span class="t-orange">pom.xml:7</span><br><span class="t-orange">● 8 high</span> · <span class="t-yellow">12 medium</span> · <span class="t-blue">3 low</span><br><br>AI triage cleared <strong>9 false positives</strong>.' },
  { type: 'user', html: 'Is the command injection in deploy.py a real issue?' },
  { type: 'tool', html: '<span class="mcp-tool-name">vygl:ai_verify_finding</span> <span class="mcp-tool-status">✓</span>' },
  { type: 'assistant', html: '<span class="t-yellow">⚠ Likely False Positive</span> · High confidence<br><br>The input is validated through an allowlist before reaching <span class="t-orange">os.system()</span>. Only predefined deploy commands are accepted.' },
];

function runMcpCursorDemo() {
  if (mcpCursorAnimating) return;
  mcpCursorAnimating = true;
  var gen = ++mcpCursorGen;

  if (mcpCursorChat) mcpCursorChat.innerHTML = '';

  var delays = [300, 400, 800, 1500, 400, 800];
  var totalDelay = 0;

  mcpCursorMessages.forEach(function(msg, i) {
    totalDelay += delays[i] || 500;
    setTimeout(function() {
      if (gen !== mcpCursorGen) return;
      var div = document.createElement('div');
      div.className = 'mcp-chat-msg mcp-chat-' + msg.type;
      div.innerHTML = msg.html;
      div.style.animation = 'cli-fade-in 0.3s ease-out both';
      if (mcpCursorChat) {
        mcpCursorChat.appendChild(div);
        mcpCursorChat.scrollTop = mcpCursorChat.scrollHeight;
      }
    }, totalDelay);
  });

  setTimeout(function() {
    if (gen !== mcpCursorGen) return;
    mcpCursorAnimating = false;
    if (mcpCursorChat) mcpCursorChat.innerHTML = '';
    runMcpCursorDemo();
  }, totalDelay + 6000);
}

// Auto-trigger when scrolled into view
var mcpSectionEl = document.querySelector('.mcp-section');
if (mcpSectionEl) {
  var mcpObserver = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting) {
      runMcpClaudeDemo();
      mcpObserver.unobserve(mcpSectionEl);
    }
  }, { threshold: 0.3 });
  mcpObserver.observe(mcpSectionEl);
}
