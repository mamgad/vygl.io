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
const mobileOverlay = document.getElementById('mobile-nav-overlay');

function openMobileNav() {
  mobileNav.classList.add('open');
  mobileOverlay.classList.add('active');
  menuBtn.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeMobileNav() {
  mobileNav.classList.remove('open');
  mobileOverlay.classList.remove('active');
  menuBtn.classList.remove('active');
  document.body.style.overflow = '';
}

menuBtn.addEventListener('click', () => {
  if (mobileNav.classList.contains('open')) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});

// Close on overlay click
mobileOverlay.addEventListener('click', closeMobileNav);

// Close on link click
mobileNav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', closeMobileNav);
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
    closeMobileNav();
  }
});

// Mobile theme toggle
const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
if (mobileThemeToggle) {
  mobileThemeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('vygl_landing_theme', next);
  });
}

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
var mcpCodexGen = 0;
var mcpOpenCodeGen = 0;
var mcpCursorGen = 0;
var mcpClaudeAnimating = false;
var mcpCodexAnimating = false;
var mcpOpenCodeAnimating = false;
var mcpCursorAnimating = false;
var mcpClaudeOutput = document.getElementById('mcp-claude-output');
var mcpCodexOutput = document.getElementById('mcp-codex-output');
var mcpOpenCodeOutput = document.getElementById('mcp-opencode-output');
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
    mcpCodexGen++;
    mcpOpenCodeGen++;
    mcpCursorGen++;
    mcpClaudeAnimating = false;
    mcpCodexAnimating = false;
    mcpOpenCodeAnimating = false;
    mcpCursorAnimating = false;
    if (mcpClaudeOutput) mcpClaudeOutput.innerHTML = '';
    if (mcpCodexOutput) mcpCodexOutput.innerHTML = '';
    if (mcpOpenCodeOutput) mcpOpenCodeOutput.innerHTML = '';
    if (mcpCursorChat) mcpCursorChat.innerHTML = '';
    // Clear any typing text from input boxes
    var typingText = document.querySelector('.mcp-claude-typing-text');
    if (typingText) typingText.remove();
    var codexTypingText = document.querySelector('.codex-typing-text');
    if (codexTypingText) codexTypingText.remove();
    var openCodeTypingText = document.querySelector('.opencode-typing-text');
    if (openCodeTypingText) openCodeTypingText.remove();

    if (idx === '0') runMcpClaudeDemo();
    if (idx === '1') runMcpCodexDemo();
    if (idx === '2') runMcpOpenCodeDemo();
    if (idx === '3') runMcpCursorDemo();
  });
});

var mcpClaudeScript = [
  // Startup ASCII art banner
  { type: 'line', text: '', delay: 50 },
  { type: 'line', text: ' <span class="t-claude">▐▛███▜▌</span>   <span class="t-white t-bold">Claude Code</span>', delay: 60 },
  { type: 'line', text: '<span class="t-claude">▝▜█████▛▘</span>  <span class="t-muted">Sonnet 4.6 · acme-api</span>', delay: 60 },
  { type: 'line', text: '  <span class="t-claude">▘▘ ▝▝</span>', delay: 60 },
  { type: 'line', text: '', delay: 60 },
  { type: 'line', text: '<span class="t-muted">──────────────────────────────</span>', delay: 80 },
  { type: 'line', text: '', delay: 400 },
  // First interaction — typed in input box, then response in output
  { type: 'typing', text: 'what critical findings do we have in acme-api?', speed: 35 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '<span class="mcp-assistant">⏺</span> I\'ll search your security findings.', delay: 400 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="mcp-tool-call">vygl:search_findings</span><span class="t-muted">(project: </span><span class="t-emerald">"acme-api"</span><span class="t-muted">, severity: </span><span class="t-emerald">"critical"</span><span class="t-muted">)</span>', delay: 300 },
  { type: 'line', text: '', delay: 600 },
  { type: 'line', text: '  Found <span class="t-white t-bold">2</span> critical findings:', delay: 300 },
  { type: 'line', text: '', delay: 150 },
  { type: 'line', text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">SQL Injection via f-string</span>', delay: 250 },
  { type: 'line', text: '    <span class="t-purple">SAST</span> · <span class="t-muted">backend/views/users.py:42</span>', delay: 150 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">Log4Shell CVE-2021-44228</span>', delay: 250 },
  { type: 'line', text: '    <span class="t-cyan">SCA</span> · <span class="t-muted">pom.xml:7 · log4j-core@2.14.1</span>', delay: 150 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '  Both require immediate attention.', delay: 200 },
  { type: 'line', text: '', delay: 800 },
  // Second interaction — typed in input box
  { type: 'typing', text: 'verify the SQL injection — is it a real issue?', speed: 35 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '<span class="mcp-assistant">⏺</span> Let me verify that with AI triage.', delay: 400 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="mcp-tool-call">vygl:ai_verify_finding</span><span class="t-muted">(finding_id: </span><span class="t-emerald">"sql-inj-a3e7f"</span><span class="t-muted">)</span>', delay: 300 },
  { type: 'line', text: '', delay: 800 },
  { type: 'line', text: '  <span class="t-green">✓</span> <span class="t-white t-bold">True Positive</span> · <span class="t-green">High confidence</span>', delay: 400 },
  { type: 'line', text: '', delay: 150 },
  { type: 'line', text: '  User input from <span class="t-orange">request.GET.get("q")</span> is directly', delay: 200 },
  { type: 'line', text: '  interpolated into raw SQL via f-string. An attacker', delay: 150 },
  { type: 'line', text: '  can inject arbitrary SQL.', delay: 150 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="t-muted">Suggested fix — use Django ORM:</span>', delay: 200 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '    <span class="t-blue">users</span> = User.objects.filter(', delay: 100 },
  { type: 'line', text: '        name__icontains=query', delay: 100 },
  { type: 'line', text: '    )', delay: 100 },
];

function typeInInputBox(inputArea, text, speed, gen, callback) {
  var cursor = inputArea.querySelector('.mcp-claude-cursor');
  var textSpan = document.createElement('span');
  textSpan.className = 'mcp-claude-typing-text';
  if (cursor) {
    inputArea.insertBefore(textSpan, cursor);
  } else {
    inputArea.appendChild(textSpan);
  }

  var i = 0;
  function tick() {
    if (gen !== mcpClaudeGen) { textSpan.remove(); return; }
    if (i < text.length) {
      textSpan.textContent += text[i];
      i++;
      setTimeout(tick, speed);
    } else {
      // Typing done — brief pause, then clear and callback
      setTimeout(function() {
        if (gen !== mcpClaudeGen) { textSpan.remove(); return; }
        textSpan.remove();
        if (callback) callback();
      }, 300);
    }
  }
  tick();
}

function runMcpClaudeDemo() {
  if (mcpClaudeAnimating) return;
  mcpClaudeAnimating = true;
  var gen = ++mcpClaudeGen;

  if (mcpClaudeOutput) mcpClaudeOutput.innerHTML = '';
  var pre = document.createElement('pre');
  if (mcpClaudeOutput) mcpClaudeOutput.appendChild(pre);

  var inputArea = document.querySelector('.mcp-claude-input-area');
  var idx = 0;

  function processNext() {
    if (gen !== mcpClaudeGen) return;
    if (idx >= mcpClaudeScript.length) {
      // All done — pause then loop
      setTimeout(function() {
        if (gen !== mcpClaudeGen) return;
        mcpClaudeAnimating = false;
        pre.remove();
        runMcpClaudeDemo();
      }, 5000);
      return;
    }

    var item = mcpClaudeScript[idx];
    idx++;

    if (item.type === 'typing' && inputArea) {
      // Type text character-by-character in the input box
      typeInInputBox(inputArea, item.text, item.speed || 35, gen, function() {
        if (gen !== mcpClaudeGen) return;
        // Move the completed prompt into the terminal output
        var div = document.createElement('div');
        div.className = 'cli-line';
        div.innerHTML = '<span class="mcp-prompt">❯</span> <span class="t-white">' + item.text + '</span>';
        pre.appendChild(div);
        if (mcpClaudeOutput) mcpClaudeOutput.scrollTop = mcpClaudeOutput.scrollHeight;
        processNext();
      });
    } else {
      // Regular output line — add after delay
      setTimeout(function() {
        if (gen !== mcpClaudeGen) return;
        var div = document.createElement('div');
        div.className = 'cli-line';
        div.innerHTML = item.text || '&nbsp;';
        pre.appendChild(div);
        if (mcpClaudeOutput) mcpClaudeOutput.scrollTop = mcpClaudeOutput.scrollHeight;
        processNext();
      }, item.delay || 100);
    }
  }

  processNext();
}

var mcpCodexScript = [
  // First interaction — Codex CLI style with approval flow
  { type: 'typing', text: 'show me the security posture for acme-api', speed: 35 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '<span class="codex-assistant">⏵</span> I\'ll query the security posture via MCP.', delay: 400 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="codex-approval">⬡ mcp</span> <span class="t-muted">call</span> <span class="mcp-tool-call">vygl:get_security_posture</span>', delay: 300 },
  { type: 'line', text: '  <span class="t-muted">args:</span> <span class="t-emerald">{ project: "acme-api" }</span>', delay: 200 },
  { type: 'line', text: '', delay: 600 },
  { type: 'line', text: '  <span class="t-white t-bold">Security Posture — acme-api</span>', delay: 300 },
  { type: 'line', text: '', delay: 150 },
  { type: 'line', text: '  Score: <span class="t-orange t-bold">62/100</span> <span class="t-muted">(Needs Attention)</span>', delay: 250 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '  <span class="t-red">● 2 critical</span> · <span class="t-orange">8 high</span> · <span class="t-yellow">12 medium</span> · <span class="t-blue">3 low</span>', delay: 250 },
  { type: 'line', text: '  <span class="t-green">✓ 9 false positives</span> cleared by AI triage', delay: 200 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '  <span class="t-muted">Top risk:</span> SQL Injection in <span class="t-orange">users.py:42</span>', delay: 200 },
  { type: 'line', text: '', delay: 800 },
  // Second interaction
  { type: 'typing', text: 'get details on the Log4Shell finding', speed: 35 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '<span class="codex-assistant">⏵</span> Fetching that finding now.', delay: 400 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="codex-approval">⬡ mcp</span> <span class="t-muted">call</span> <span class="mcp-tool-call">vygl:get_finding_detail</span>', delay: 300 },
  { type: 'line', text: '  <span class="t-muted">args:</span> <span class="t-emerald">{ finding_id: "log4shell-b7c2d" }</span>', delay: 200 },
  { type: 'line', text: '', delay: 800 },
  { type: 'line', text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">Log4Shell — CVE-2021-44228</span>', delay: 400 },
  { type: 'line', text: '', delay: 150 },
  { type: 'line', text: '  <span class="t-cyan">SCA</span> · <span class="t-muted">pom.xml:7 · log4j-core@2.14.1</span>', delay: 200 },
  { type: 'line', text: '  CVSS: <span class="t-red t-bold">10.0</span> · Exploitability: <span class="t-red">Very High</span>', delay: 200 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="t-muted">Fix:</span> upgrade to <span class="t-green">log4j-core@2.17.1</span> or later', delay: 200 },
];

function typeInCodexComposer(composerArea, text, speed, gen, callback) {
  var cursor = composerArea.querySelector('.codex-composer-cursor');
  var textSpan = document.createElement('span');
  textSpan.className = 'codex-typing-text';
  if (cursor) {
    composerArea.insertBefore(textSpan, cursor);
  } else {
    composerArea.appendChild(textSpan);
  }

  var i = 0;
  function tick() {
    if (gen !== mcpCodexGen) { textSpan.remove(); return; }
    if (i < text.length) {
      textSpan.textContent += text[i];
      i++;
      setTimeout(tick, speed);
    } else {
      setTimeout(function() {
        if (gen !== mcpCodexGen) { textSpan.remove(); return; }
        textSpan.remove();
        if (callback) callback();
      }, 300);
    }
  }
  tick();
}

function runMcpCodexDemo() {
  if (mcpCodexAnimating) return;
  mcpCodexAnimating = true;
  var gen = ++mcpCodexGen;

  if (mcpCodexOutput) mcpCodexOutput.innerHTML = '';
  var pre = document.createElement('pre');
  if (mcpCodexOutput) mcpCodexOutput.appendChild(pre);

  var composerArea = document.querySelector('.codex-composer-area');
  var idx = 0;

  function processNext() {
    if (gen !== mcpCodexGen) return;
    if (idx >= mcpCodexScript.length) {
      setTimeout(function() {
        if (gen !== mcpCodexGen) return;
        mcpCodexAnimating = false;
        pre.remove();
        runMcpCodexDemo();
      }, 5000);
      return;
    }

    var item = mcpCodexScript[idx];
    idx++;

    if (item.type === 'typing' && composerArea) {
      typeInCodexComposer(composerArea, item.text, item.speed || 35, gen, function() {
        if (gen !== mcpCodexGen) return;
        var div = document.createElement('div');
        div.className = 'cli-line';
        div.innerHTML = '<span class="codex-prompt">❯</span> <span class="t-white">' + item.text + '</span>';
        pre.appendChild(div);
        if (mcpCodexOutput) mcpCodexOutput.scrollTop = mcpCodexOutput.scrollHeight;
        processNext();
      });
    } else {
      setTimeout(function() {
        if (gen !== mcpCodexGen) return;
        var div = document.createElement('div');
        div.className = 'cli-line';
        div.innerHTML = item.text || '&nbsp;';
        pre.appendChild(div);
        if (mcpCodexOutput) mcpCodexOutput.scrollTop = mcpCodexOutput.scrollHeight;
        processNext();
      }, item.delay || 100);
    }
  }

  processNext();
}

// ── OpenCode Demo ──
var mcpOpenCodeScript = [
  // Startup ASCII art banner
  { type: 'line', text: '', delay: 50 },
  { type: 'line', text: '  <span class="t-opencode">⌬</span> <span class="t-white t-bold">OpenCode</span>', delay: 60 },
  { type: 'line', text: '', delay: 60 },
  { type: 'line', text: '  <span class="t-muted">Session:</span> <span class="t-white">default</span>    <span class="t-muted">Agent:</span> <span class="t-opencode">build</span>', delay: 80 },
  { type: 'line', text: '  <span class="t-muted">Type a message or</span> <span class="t-opencode">@</span> <span class="t-muted">to reference files</span>', delay: 80 },
  { type: 'line', text: '', delay: 400 },
  // First interaction — OpenCode style with orange accents
  { type: 'typing', text: 'what critical findings do we have in acme-api?', speed: 35 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '<span class="opencode-assistant-marker">◆</span> I\'ll search for critical findings in your project.', delay: 400 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="opencode-tool-badge">vygl:search_findings</span><span class="t-muted">(project: </span><span class="t-emerald">"acme-api"</span><span class="t-muted">, severity: </span><span class="t-emerald">"critical"</span><span class="t-muted">)</span>', delay: 300 },
  { type: 'line', text: '', delay: 600 },
  { type: 'line', text: '  Found <span class="t-white t-bold">2</span> critical findings:', delay: 300 },
  { type: 'line', text: '', delay: 150 },
  { type: 'line', text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">SQL Injection via f-string</span>', delay: 250 },
  { type: 'line', text: '    <span class="t-purple">SAST</span> · <span class="t-muted">backend/views/users.py:42</span>', delay: 150 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '  <span class="t-red">●</span> <span class="t-red t-bold">CRITICAL</span>  <span class="t-white">Log4Shell CVE-2021-44228</span>', delay: 250 },
  { type: 'line', text: '    <span class="t-cyan">SCA</span> · <span class="t-muted">pom.xml:7 · log4j-core@2.14.1</span>', delay: 150 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '  Both require immediate attention.', delay: 200 },
  { type: 'line', text: '', delay: 800 },
  // Second interaction
  { type: 'typing', text: 'verify the SQL injection — is it a real issue?', speed: 35 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '<span class="opencode-assistant-marker">◆</span> Running AI verification on that finding.', delay: 400 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="opencode-tool-badge">vygl:ai_verify_finding</span><span class="t-muted">(finding_id: </span><span class="t-emerald">"sql-inj-a3e7f"</span><span class="t-muted">)</span>', delay: 300 },
  { type: 'line', text: '', delay: 800 },
  { type: 'line', text: '  <span class="t-green">✓</span> <span class="t-white t-bold">True Positive</span> · <span class="t-green">High confidence</span>', delay: 400 },
  { type: 'line', text: '', delay: 150 },
  { type: 'line', text: '  User input from <span class="t-orange">request.GET.get("q")</span> is directly', delay: 200 },
  { type: 'line', text: '  interpolated into raw SQL via f-string. An attacker', delay: 150 },
  { type: 'line', text: '  can inject arbitrary SQL.', delay: 150 },
  { type: 'line', text: '', delay: 200 },
  { type: 'line', text: '  <span class="t-muted">Suggested fix — use Django ORM:</span>', delay: 200 },
  { type: 'line', text: '', delay: 100 },
  { type: 'line', text: '    <span class="t-blue">users</span> = User.objects.filter(', delay: 100 },
  { type: 'line', text: '        name__icontains=query', delay: 100 },
  { type: 'line', text: '    )', delay: 100 },
];

function typeInOpenCodeInput(inputArea, text, speed, gen, callback) {
  var cursor = inputArea.querySelector('.opencode-input-cursor');
  var textSpan = document.createElement('span');
  textSpan.className = 'opencode-typing-text';
  if (cursor) {
    inputArea.insertBefore(textSpan, cursor);
  } else {
    inputArea.appendChild(textSpan);
  }

  var i = 0;
  function tick() {
    if (gen !== mcpOpenCodeGen) { textSpan.remove(); return; }
    if (i < text.length) {
      textSpan.textContent += text[i];
      i++;
      setTimeout(tick, speed);
    } else {
      setTimeout(function() {
        if (gen !== mcpOpenCodeGen) { textSpan.remove(); return; }
        textSpan.remove();
        if (callback) callback();
      }, 300);
    }
  }
  tick();
}

function runMcpOpenCodeDemo() {
  if (mcpOpenCodeAnimating) return;
  mcpOpenCodeAnimating = true;
  var gen = ++mcpOpenCodeGen;

  if (mcpOpenCodeOutput) mcpOpenCodeOutput.innerHTML = '';
  var pre = document.createElement('pre');
  if (mcpOpenCodeOutput) mcpOpenCodeOutput.appendChild(pre);

  var inputArea = document.querySelector('.opencode-input-area');
  var idx = 0;

  function processNext() {
    if (gen !== mcpOpenCodeGen) return;
    if (idx >= mcpOpenCodeScript.length) {
      setTimeout(function() {
        if (gen !== mcpOpenCodeGen) return;
        mcpOpenCodeAnimating = false;
        pre.remove();
        runMcpOpenCodeDemo();
      }, 5000);
      return;
    }

    var item = mcpOpenCodeScript[idx];
    idx++;

    if (item.type === 'typing' && inputArea) {
      typeInOpenCodeInput(inputArea, item.text, item.speed || 35, gen, function() {
        if (gen !== mcpOpenCodeGen) return;
        var div = document.createElement('div');
        div.className = 'cli-line';
        div.innerHTML = '<span class="opencode-prompt">❯</span> <span class="t-white">' + item.text + '</span>';
        pre.appendChild(div);
        if (mcpOpenCodeOutput) mcpOpenCodeOutput.scrollTop = mcpOpenCodeOutput.scrollHeight;
        processNext();
      });
    } else {
      setTimeout(function() {
        if (gen !== mcpOpenCodeGen) return;
        var div = document.createElement('div');
        div.className = 'cli-line';
        div.innerHTML = item.text || '&nbsp;';
        pre.appendChild(div);
        if (mcpOpenCodeOutput) mcpOpenCodeOutput.scrollTop = mcpOpenCodeOutput.scrollHeight;
        processNext();
      }, item.delay || 100);
    }
  }

  processNext();
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

// ─── Side Navigation & Active Section Tracking ───
(function() {
  var sideNav = document.getElementById('side-nav');
  var tocFab = document.getElementById('toc-fab');
  var tocPanel = document.getElementById('toc-panel');
  var tocClose = document.getElementById('toc-close');
  var tocBackdrop = document.getElementById('toc-backdrop');
  var backToTop = document.getElementById('back-to-top');

  if (!sideNav) return;

  // Section IDs in order (matches page flow)
  var sectionIds = [
    'scan-demo', 'features', 'ai-demo', 'ai-consultation',
    'providers', 'benefits', 'how-it-works', 'dashboard', 'integrations', 'mcp'
  ];

  // Map section IDs to top nav hrefs
  var navLinkMap = {
    'features': '#features',
    'ai-demo': '#ai-demo',
    'providers': '#providers',
    'how-it-works': '#how-it-works',
    'integrations': '#integrations',
    'mcp': '#mcp'
  };

  var sideNavItems = sideNav.querySelectorAll('.side-nav-item');
  var sideNavProgress = document.getElementById('side-nav-progress');
  var tocLinks = tocPanel ? tocPanel.querySelectorAll('.toc-link') : [];
  var topNavLinks = document.querySelectorAll('.nav-links a');
  var currentActive = 'scan-demo';

  function setActive(sectionId) {
    if (sectionId === currentActive) return;
    currentActive = sectionId;

    // Update side nav items
    var activeIdx = 0;
    sideNavItems.forEach(function(item, i) {
      var isActive = item.dataset.section === sectionId;
      item.classList.toggle('active', isActive);
      if (isActive) activeIdx = i;
    });

    // Update progress bar height
    if (sideNavProgress && sideNavItems.length > 1) {
      var pct = (activeIdx / (sideNavItems.length - 1)) * 100;
      sideNavProgress.style.height = pct + '%';
    }

    // Update mobile TOC
    tocLinks.forEach(function(link) {
      link.classList.toggle('active', link.dataset.section === sectionId);
    });

    // Update top nav links
    topNavLinks.forEach(function(link) {
      var href = link.getAttribute('href');
      var matchesSection = false;
      for (var id in navLinkMap) {
        if (navLinkMap[id] === href && id === sectionId) {
          matchesSection = true;
          break;
        }
      }
      link.classList.toggle('nav-active', matchesSection);
    });
  }

  // IntersectionObserver to track which section is visible
  var sectionEls = [];
  sectionIds.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) sectionEls.push({ id: id, el: el });
  });

  var sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        setActive(entry.target.id);
      }
    });
  }, {
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  });

  sectionEls.forEach(function(s) {
    sectionObserver.observe(s.el);
  });

  // Show/hide side nav & back-to-top based on scroll position
  var showThreshold = 300;

  function updateVisibility() {
    var scrolled = window.scrollY > showThreshold;
    sideNav.classList.toggle('visible', scrolled);
    if (tocFab) tocFab.classList.toggle('visible', scrolled);
    if (backToTop) backToTop.classList.toggle('visible', scrolled);
  }

  window.addEventListener('scroll', updateVisibility, { passive: true });
  updateVisibility();

  // Back to top
  if (backToTop) {
    backToTop.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile TOC toggle
  function openToc() {
    if (tocPanel) tocPanel.classList.add('open');
  }

  function closeToc() {
    if (tocPanel) tocPanel.classList.remove('open');
  }

  if (tocFab) tocFab.addEventListener('click', openToc);
  if (tocClose) tocClose.addEventListener('click', closeToc);
  if (tocBackdrop) tocBackdrop.addEventListener('click', closeToc);

  // Close TOC on link click
  tocLinks.forEach(function(link) {
    link.addEventListener('click', function() {
      closeToc();
    });
  });

  // Side nav smooth scroll + update URL bar
  sideNavItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      var href = item.getAttribute('href');
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    });
  });

  // Mobile TOC links update URL bar too
  tocLinks.forEach(function(link) {
    link.addEventListener('click', function(e) {
      var href = link.getAttribute('href');
      var target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        closeToc();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      }
    });
  });
})();
