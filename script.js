 const bubbles = document.getElementById('bubbles');
    for (let i=0;i<20;i++){
      const b=document.createElement('div');
      b.className='bubble';
      const s=Math.random()*48+8;
      b.style.width=b.style.height = s+'px';
      b.style.left = Math.random()*100 + '%';
      b.style.top  = Math.random()*100 + '%';
      b.style.opacity = (0.12 + Math.random()*0.7).toString();
      b.style.animationDuration = (8 + Math.random()*10) + 's';
      bubbles.appendChild(b);
    }

    /* AUTH */
    const USERS_KEY = 'samudra_users';
    const CURRENT_KEY = 'samudra_currentUser';
    function loadUsers(){ try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch(e){ return {}; } }
    function saveUsers(obj){ localStorage.setItem(USERS_KEY, JSON.stringify(obj)); }
    function validEmail(e){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

    const authForm = document.getElementById('auth-form');
    const authBtn = document.getElementById('auth-btn');
    const switchBtn = document.getElementById('switch-btn');
    const switchText = document.getElementById('switch-text');
    const loginFeedback = document.getElementById('login-feedback');
    const authTitle = document.getElementById('auth-title');
    const confirmInput = document.getElementById('confirm-password');
    let isLogin = true;

    function setFeedback(msg, type=''){ 
      loginFeedback.textContent = msg; 
      loginFeedback.className = 'login-info ' + (type==='error'?'fb-error':(type==='success'?'fb-success':'')); 
    }

    function updateModeUI() {
      const usernameInput = document.getElementById('username');
      if (isLogin) {
        authTitle.textContent = 'Login'; authBtn.textContent = 'Login';
        switchText.textContent = "Don't have an account?"; switchBtn.textContent = 'Sign up';
        confirmInput.style.display = 'none'; usernameInput.style.display = 'none';
      } else {
        authTitle.textContent = 'Create account'; authBtn.textContent = 'Sign up';
        switchText.textContent = 'Already have an account?'; switchBtn.textContent = 'Login';
        confirmInput.style.display = 'block'; usernameInput.style.display = 'block';
      }
      setFeedback('', ''); document.getElementById('email').focus();
    }

    switchBtn.addEventListener('click', ()=>{ isLogin=!isLogin; updateModeUI(); });

    authForm.addEventListener('submit', (ev) => {
      ev.preventDefault(); setFeedback('', '');
      const email = (document.getElementById('email').value||'').trim().toLowerCase();
      const pwd = (document.getElementById('password').value||'');
      const confirm = (confirmInput.value||'');
      const username = (document.getElementById('username').value||'').trim();

      if (!validEmail(email)) return setFeedback('❌ Invalid email.', 'error');
      if (pwd.length < 6) return setFeedback('❌ Password min 6 chars.', 'error');

      const users = loadUsers();
      if (isLogin){
        if (users[email] && users[email].password===pwd){ showHome(email); }
        else setFeedback('❌ Invalid email or password.', 'error');
      } else {
        if (pwd!==confirm) return setFeedback('❌ Passwords do not match.', 'error');
        if (users[email]) return setFeedback('❌ Email already registered.', 'error');
        if (!username) return setFeedback('❌ Enter a username.', 'error');
        users[email]={username,password:pwd}; saveUsers(users);
        setFeedback('✅ Account created — logging in...','success');
        setTimeout(()=>showHome(email),650);
      }
    });

    function showHome(email){
      const users=loadUsers(); const current=users[em+ail];
      localStorage.setItem(CURRENT_KEY,email);
      document.getElementById('login-page').style.display='none';
      document.getElementById('home-page').style.display='block';
      document.getElementById('welcome').textContent='Welcome, '+(current.username||email);
    }

    document.getElementById('logout-btn').addEventListener('click',()=>{
      localStorage.removeItem(CURRENT_KEY);
      document.getElementById('home-page').style.display='none';
      document.getElementById('login-page').style.display='flex';
      document.getElementById('messages').innerHTML='';
      document.getElementById('email').value=''; document.getElementById('password').value='';
      confirmInput.value=''; isLogin=true; updateModeUI();
    });

    /* CHAT + typing animation + voice */
    const messagesEl=document.getElementById('messages');
    function appendMessage(text,cls){ 
      const el=document.createElement('div'); el.className='msg '+cls; el.textContent=text; 
      messagesEl.appendChild(el); messagesEl.scrollTop=messagesEl.scrollHeight; return el;
    }
    async function sendUserMessage(text){
  appendMessage(text,'user-msg');
  const typingEl = appendMessage('AI is typing...','ai-msg');
  let dots = 0;
  const dotInterval = setInterval(()=>{
    dots = (dots+1)%4;
    typingEl.textContent = 'AI is typing' + '.'.repeat(dots);
  },400);

  try {
    const response = await fetch('http://127.0.0.1:8000/ask-ai/', {  // your FastAPI endpoint
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({prompt: text})
    });
    const data = await response.json();
    clearInterval(dotInterval);
    typingEl.remove();

    const reply = data.response; // updated to match FastAPI
   appendMessage('🌊 AI: ' + reply, 'ai-msg');

    speakText(reply);
  } catch(err){
    clearInterval(dotInterval);
    typingEl.remove();
    appendMessage('❌ Error fetching response','ai-msg');
    console.error(err);
  }
}

    function speakText(t){
      if ('speechSynthesis' in window){
        const utter=new SpeechSynthesisUtterance(t.replace(/^🌊 AI:/,''));
        utter.rate=0.95; utter.pitch=0.9; utter.volume=0.8;
        speechSynthesis.speak(utter);
      }
    }

    /* MAP toggle */
    const mapPanel=document.getElementById('map-panel');
    document.getElementById('globe-btn').addEventListener('click',()=>{ mapPanel.classList.toggle('expanded'); });

    /* PROFILE modal */
    const profileModal=document.getElementById('profile-modal');
    const profileInfo=document.getElementById('profile-info');
       document.getElementById('btn-profile').addEventListener('click', ()=>{
      const email=localStorage.getItem(CURRENT_KEY); const users=loadUsers(); const current=users[email] || {};
      profileInfo.innerHTML=`<p><b>Username:</b> ${current.username || '—'}</p><p><b>Email:</b> ${email || '—'}</p>`;
      profileModal.style.display='block';
    });
    document.getElementById('close-profile').addEventListener('click',()=>{ profileModal.style.display='none'; });

    updateModeUI();

    /* --- Ripple effect (inject CSS and handler) --- */
    (function addRippleCSS(){
      const css = `
      .ripple {
        position:fixed;
        border-radius:50%;
        pointer-events:none;
        transform:translate(-50%,-50%) scale(0);
        background: radial-gradient(circle, rgba(124,240,217,0.18) 0%, rgba(124,240,217,0.06) 40%, rgba(124,240,217,0) 70%);
        width: 20px; height: 20px; opacity:0.95; z-index:9;
        animation: rippleAnim 700ms cubic-bezier(.22,.9,.3,1);
      }
      @keyframes rippleAnim {
        to { transform:translate(-50%,-50%) scale(18); opacity:0; }
      }`;
      const s=document.createElement('style'); s.appendChild(document.createTextNode(css)); document.head.appendChild(s);
    })();

    function spawnRipple(x,y){
      const r=document.createElement('div');
      r.className='ripple';
      r.style.left = x + 'px';
      r.style.top  = y + 'px';
      document.body.appendChild(r);
      r.addEventListener('animationend', ()=> r.remove());
    }
    // attach to interactive elements (delegation)
    document.addEventListener('click', (e)=>{
      const target = e.target;
      // ignore clicks on inputs to avoid interfering
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      spawnRipple(e.clientX, e.clientY);
    }, true);

    /* --- Dive Mode (button behavior + audio) --- */
    const diveBtn = document.getElementById('dive-btn');
    const oceanAudio = document.getElementById('ocean-audio');
    let diveActive = false;
    // make sure audio is allowed to play only after user gesture (click)
    diveBtn.addEventListener('click', async ()=>{
      diveActive = !diveActive;
      document.body.classList.toggle('dive-mode', diveActive);
      // speed up bubbles
      Array.from(document.querySelectorAll('.bubble')).forEach(b=>{
        // store original duration for toggling
        if (!b.dataset.origDuration) b.dataset.origDuration = b.style.animationDuration || '12s';
        b.style.animationDuration = diveActive ? (Number(b.dataset.origDuration.replace('s',''))/1.8 + 's') : b.dataset.origDuration;
      });
      // currents react stronger
      currentsIntensity = diveActive ? 1.6 : 1.0;
      // play/pause audio (user gesture allowed)
      try {
        if (diveActive){
          await oceanAudio.play().catch(()=>{/* play might be blocked if not user gesture but diveBtn click is a gesture */});
          diveBtn.style.boxShadow = '0 10px 30px rgba(0,0,0,0.7), inset 0 0 18px rgba(0,150,160,0.15)';
        } else {
          oceanAudio.pause(); oceanAudio.currentTime = 0;
          diveBtn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.6)';
        }
      } catch(err){
        // ignore play errors
        console.warn('Audio play failed', err);
      }
    });

    /* --- Currents Canvas Animation --- */
    const canvas = document.getElementById('currents');
    const ctx = canvas.getContext('2d', { alpha: true });
    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;

    window.addEventListener('resize', ()=>{
      W = canvas.width = innerWidth;
      H = canvas.height = innerHeight;
    });

    // simple flow-lines using sine waves, with particles moving along them
    const lines = [];
    const LINE_COUNT = Math.round(Math.min(22, Math.max(12, window.innerWidth/80)));
    let currentsIntensity = 1.0;
    for (let i=0;i<LINE_COUNT;i++){
      lines.push({
        offset: Math.random()*Math.PI*2,
        speed: 0.2 + Math.random()*0.6,
        amplitude: 18 + Math.random()*36,
        y: (i+1)*(H/(LINE_COUNT+1)) + (Math.random()*30-15),
        hue: 190 + Math.random()*30,
        alpha: 0.08 + Math.random()*0.12
      });
    }

    // particles that flow along the field
    const particles=[];
    for (let i=0;i<Math.round(W/80);i++){
      particles.push({
        x: Math.random()*W,
        y: Math.random()*H,
        vx: 0,
        vy: 0,
        size: 1 + Math.random()*2,
        life: Math.random()*300
      });
    }

    // disturbance when typing/clicking (reactive ripple to current)
    let disturbance = 0;
    function triggerDisturbance(amount=1.2){
      disturbance = Math.min(2.5, disturbance + amount);
      setTimeout(()=>{ disturbance = Math.max(0, disturbance - amount/2); }, 400);
    }
    // trigger disturbance on typing
    document.getElementById('chat-input').addEventListener('input', ()=>{ triggerDisturbance(0.9); });

    // also react when messages are sent
    document.getElementById('send-btn').addEventListener('click', () => {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  sendUserMessage(text); // call your AI function
  input.value = '';      // clear input after sending
  triggerDisturbance(1.6); // keep your bubble effect
});


    let t0 = performance.now();
    function draw(){
      const t = performance.now();
      const dt = (t - t0)/1000; t0 = t;

      ctx.clearRect(0,0,W,H);
      // faint fog overlay
      ctx.fillStyle = 'rgba(0,10,18,0.04)';
      ctx.fillRect(0,0,W,H);

      // draw flow lines
      for (let i=0;i<lines.length;i++){
        const L = lines[i];
        const phase = (t/1000)*L.speed*0.9 + L.offset;
        const amp = L.amplitude * (1 + 0.35*disturbance) * currentsIntensity;
        ctx.beginPath();
        const segments = 120;
        for (let s=0;s<=segments;s++){
          const x = (s/segments)*W;
          // wave formula mixing s and phase
          const y = L.y + Math.sin((s/segments)*Math.PI*2 + phase)*amp * Math.sin(t/2000 + s*0.01);
          if (s===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.strokeStyle = `hsla(${L.hue},70%,60%,${L.alpha})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // update particles
      for (let p of particles){
        // sample an approximate flow vector using sin waves sum
        let fx=0, fy=0;
        for (let L of lines){
          const nx = (p.x / W) * Math.PI*2;
          const phase = (t/1000)*L.speed + L.offset;
          const vy = Math.cos(nx + phase) * (L.amplitude*0.02) * currentsIntensity;
          fx += 0.2 * Math.sin(phase) * (0.6 + disturbance*0.6);
          fy += vy;
        }
        // integrate
        p.vx += fx * 0.25 * dt;
        p.vy += fy * 0.25 * dt;
        // damping
        p.vx *= 0.98; p.vy *= 0.98;
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;

        // wrap
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        // draw particle
        ctx.beginPath();
        ctx.globalAlpha = 0.7 * (0.3 + Math.sin(p.life*0.02)*0.7);
        ctx.fillStyle = 'rgba(172, 246, 243, 0.9)';
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        p.life -= 0.4;
        if (p.life < 0){ p.life = 200 + Math.random()*200; p.x = Math.random()*W; p.y = Math.random()*H; }
      }

      // gradually decay disturbance
      disturbance = Math.max(0, disturbance - 0.01);

      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    /* --- Accessibility: allow mute/unmute audio via keyboard (M) --- */
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'm' || e.key === 'M'){
        if (!oceanAudio) return;
        if (oceanAudio.paused) oceanAudio.play().catch(()=>{});
        else oceanAudio.pause();
      }
    });

    /* --- Ensure map panel close when clicking outside expanded map --- */
    document.addEventListener('click', (e)=>{
      if (!mapPanel.classList.contains('expanded')) return;
      const inside = mapPanel.contains(e.target) || document.getElementById('globe-btn').contains(e.target);
      if (!inside){
        mapPanel.classList.remove('expanded');
      }
    });

    /* --- small safety: stop speech if user mutes by toggling dive off --- */
    const originalSpeak = speakText;
    // override speak to respect diveActive (optional: speak always but softer in dive)
    function speakText(t){
      if (!('speechSynthesis' in window)) return;
      const utter=new SpeechSynthesisUtterance(t.replace(/^🌊 AI:/,''));
      utter.rate = 0.95;
      utter.pitch = diveActive ? 0.78 : 0.95;
      utter.volume = diveActive ? 0.6 : 0.85;
      speechSynthesis.speak(utter);
    }

    /* --- small UX: focus chat input on home show --- */
    const originalShowHome = showHome;
    function showHome(email){
  const users = loadUsers(); 
  const current = users[email];
  localStorage.setItem(CURRENT_KEY,email);
  document.getElementById('login-page').style.display='none';
  document.getElementById('home-page').style.display='block';
  document.getElementById('welcome').textContent='Welcome, ' + (current.username || email);
}


    // replace the auth showHome with our enhanced one
    // (the earlier code already used showHome; this redefinition ensures focus behavior)
    window.showHome = showHome;

    /* --- final: ensure audio element is visually hidden but accessible --- */
    oceanAudio.setAttribute('aria-hidden', 'true'); oceanAudio.style.display = 'none';