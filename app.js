(() => {
  const $ = (selector) => document.querySelector(selector);
  const codeInput = $('#code');
  const lineNumbers = $('#lines');
  const result = $('#result');
  const empty = $('#empty');
  const status = $('#status');
  const reviewButton = $('#review');
  const languageSelect = document.querySelector('.settings select');
  const navigation = document.querySelectorAll('.nav');
  const reviewGrid = $('.grid');
  const main = $('main');
  const pageTitle = $('h1');
  const pageSubtitle = $('.sub');
  const historyKey = 'codeguard-review-history';
  const chatHistory = [];

  const historyView = document.createElement('section');
  historyView.className = 'history-view';
  historyView.innerHTML = '<div class="history-toolbar"><button class="secondary" id="clear-history">清空记录</button></div><div class="history-list" id="history-list"></div>';
  main.appendChild(historyView);

  const chatView = document.createElement('section');
  chatView.className = 'chat-view';
  chatView.innerHTML = '<div class="chat-shell"><div class="chat-messages" id="chat-messages"><div class="chat-welcome"><h2>今天想评审什么代码？</h2><p>询问安全风险、性能优化、代码规范，或粘贴一段代码开始讨论。</p></div></div><div class="chat-composer"><textarea id="chat-input" rows="1" placeholder="输入你的问题…"></textarea><button class="chat-send" id="chat-send" aria-label="发送">↑</button></div></div>';
  main.appendChild(chatView);

  const rulesView = document.createElement('section');
  rulesView.className = 'rules-view';
  rulesView.innerHTML = '<div class="rules-shell"><div class="rules-copy"><span class="rules-eyebrow">RULES LAB · MINI GAME</span><h2>规则配置实验室</h2><p>在发布规则前，先休息一下。使用方向键或 WASD 控制贪吃蛇，吃到光点即可得分。</p><div class="game-stats"><div><span>当前得分</span><b id="snake-score">0</b></div><div><span>最高得分</span><b id="snake-best">0</b></div></div><div class="game-actions"><button class="primary" id="snake-start">开始</button><button class="secondary" id="snake-reset">重新开始</button></div><small class="game-tip">撞到边界或自己时游戏结束。按空格键也可暂停 / 继续。</small></div><div class="game-board-wrap"><canvas id="snake-board" width="360" height="360" aria-label="贪吃蛇游戏区域"></canvas><div class="game-state" id="snake-state">点击“开始”</div></div></div>';
  main.appendChild(rulesView);

  const spiderView = document.createElement('section');
  spiderView.className = 'spider-view';
  spiderView.innerHTML = `
    <div class="spider-shell">
      <div class="spider-topbar">
        <div><span class="spider-eyebrow">CLASSIC · ONE SUIT</span><h2>蜘蛛纸牌</h2></div>
        <div class="spider-stats"><span>步数 <b id="spider-moves">0</b></span><span>已收 <b id="spider-complete">0</b>/8</span></div>
        <div class="spider-actions"><button class="spider-icon" id="spider-undo" title="撤销">↶</button><button class="secondary" id="spider-new">重新开始</button></div>
      </div>
      <div class="spider-table" id="spider-table">
        <div class="spider-stock-area"><button class="spider-stock" id="spider-stock" aria-label="发牌"><span>♠</span></button><small id="spider-stock-count">剩余 5 叠</small></div>
        <div class="spider-foundation" id="spider-foundation" aria-label="已完成的牌组"></div>
        <div class="spider-columns" id="spider-columns"></div>
        <div class="spider-toast" id="spider-toast" aria-live="polite"></div>
      </div>
      <div class="spider-help">点击一叠连续降序牌，再点击目标列即可移动。凑齐从 K 到 A 的同花顺会自动收走。</div>
    </div>`;
  main.appendChild(spiderView);
  const healthView = document.createElement('section');
  healthView.className = 'health-view';
  healthView.innerHTML = `
    <div class="health-shell">
      <div class="health-hero"><div><span>PERSONAL WELLBEING · LOCAL ONLY</span><h2>健康生活数据整合</h2><p>把睡眠、活动与生活记录放在一起看。数据仅保存在当前浏览器。</p></div><button class="secondary" id="health-demo">载入示例数据</button></div>
      <section class="health-access" aria-labelledby="health-access-title">
        <div><span class="health-access-icon">◎</span><div><h3 id="health-access-title">访问身份</h3><p id="health-role-description"></p></div></div>
        <label>当前身份<select id="health-role"><option value="owner">所有者</option><option value="recorder">记录员</option><option value="viewer">访客</option></select></label>
        <div class="health-permissions" id="health-permissions" aria-live="polite"></div>
      </section>
      <div class="health-metrics">
        <article><small>今日步数</small><strong id="health-steps">--</strong><em id="health-steps-note">等待记录</em></article>
        <article><small>昨夜睡眠</small><strong id="health-sleep">--</strong><em id="health-sleep-note">等待记录</em></article>
        <article><small>连续记录</small><strong id="health-streak">0 天</strong><em>近 7 日数据</em></article>
        <article><small>今日心情</small><strong id="health-mood">--</strong><em id="health-mood-note">尚未填写</em></article>
      </div>
      <div class="health-grid">
        <section class="health-panel health-chart"><div class="health-panel-title"><div><h3>近 7 天概览</h3><p>步数与睡眠时长</p></div><div class="health-legend"><i></i>步数 <b></b>睡眠</div></div><div class="health-bars" id="health-bars"></div></section>
        <section class="health-panel health-add"><h3>添加每日记录</h3><form id="health-form"><label>日期<input id="health-date" type="date" required></label><label>数据来源<select id="health-source"><option>手动记录</option><option>Apple 健康导入</option><option>运动手表导入</option><option>睡眠 App 导入</option></select></label><div class="health-form-row"><label>步数<input id="health-steps-input" type="number" min="0" placeholder="例如 8500"></label><label>睡眠（小时）<input id="health-sleep-input" type="number" min="0" max="24" step="0.1" placeholder="例如 7.5"></label></div><label>心情<select id="health-mood-input"><option value="">暂不记录</option><option>很好</option><option>不错</option><option>一般</option><option>疲惫</option></select></label><button class="primary" type="submit">保存到健康面板</button></form></section>
      </div>
      <section class="health-panel health-sources"><div><h3>已整合的数据来源</h3><p>先支持手动汇总；不同设备导出的数据可按日期录入到同一面板。</p></div><div id="health-source-list" class="health-source-list"></div></section>
    </div>`;
  main.appendChild(healthView);
  const healthStyle = document.createElement('style');
  healthStyle.textContent = `.health-view{display:none;max-width:1180px;margin:0 auto}.health-shell{color:#1d2a3d}.health-hero{display:flex;justify-content:space-between;align-items:center;padding:27px 30px;border-radius:18px;background:linear-gradient(118deg,#e8f8f2,#edf2ff 55%,#fff7ec);border:1px solid #dce9e6}.health-hero span{font-size:10px;font-weight:800;letter-spacing:.12em;color:#378575}.health-hero h2{margin:8px 0 5px;font-size:29px}.health-hero p,.health-panel p,.health-access p{margin:0;color:#708096;font-size:13px}.health-access{display:flex;align-items:center;gap:18px;margin:16px 0;padding:14px 18px;border:1px solid #dce7f1;border-radius:13px;background:#f9fbfe}.health-access>div:first-child{display:flex;align-items:center;gap:11px;min-width:255px}.health-access-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#e6f2ff;color:#386fc7;font-size:20px}.health-access h3{margin:0 0 2px;font-size:14px}.health-access label{display:grid;gap:4px;color:#687891;font-size:11px}.health-access select{min-width:115px;padding:7px 9px;border:1px solid #cfdae7;border-radius:7px;background:#fff;color:#263950}.health-permissions{display:flex;flex-wrap:wrap;gap:6px;margin-left:auto}.health-permission{padding:5px 8px;border-radius:999px;background:#eaf6ef;color:#347a5e;font-size:11px}.health-permission.denied{background:#f2f4f7;color:#8a96a7;text-decoration:line-through}.health-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:13px;margin:16px 0}.health-metrics article,.health-panel{background:#fff;border:1px solid #e2eaf3;border-radius:14px;box-shadow:0 8px 24px #29405b0b}.health-metrics article{padding:18px}.health-metrics small{display:block;color:#7f8da1;font-size:12px}.health-metrics strong{display:block;margin:9px 0 5px;font-size:26px;color:#1d3553}.health-metrics em{font-size:12px;color:#4b9c83;font-style:normal}.health-grid{display:grid;grid-template-columns:1.35fr .85fr;gap:16px}.health-panel{padding:21px}.health-panel h3{margin:0 0 4px;font-size:16px}.health-panel-title{display:flex;justify-content:space-between}.health-legend{font-size:11px;color:#79879b}.health-legend i,.health-legend b{display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 4px;background:#4a9f8a}.health-legend b{background:#7996e5}.health-bars{height:215px;display:flex;align-items:flex-end;justify-content:space-between;gap:8px;padding:18px 0 2px}.health-day{flex:1;min-width:32px;height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:5px;font-size:10px;color:#7a899e}.health-columns{height:165px;width:100%;display:flex;align-items:flex-end;justify-content:center;gap:4px}.health-columns i{display:block;width:10px;border-radius:5px 5px 2px 2px;background:#4a9f8a}.health-columns b{display:block;width:10px;border-radius:5px 5px 2px 2px;background:#7996e5}.health-add form{display:grid;gap:10px;margin-top:14px}.health-add label{display:grid;gap:5px;font-size:12px;color:#62738b}.health-add input,.health-add select{box-sizing:border-box;width:100%;padding:9px;border:1px solid #dce5ef;border-radius:7px;background:#fbfdff;color:#24354a}.health-form-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.health-add button{margin:4px 0 0}.health-readonly{position:relative;opacity:.62}.health-readonly:after{content:'当前身份为只读';position:absolute;inset:0;display:grid;place-items:center;border-radius:14px;background:#f7f9fcd9;color:#52647c;font-weight:700}.health-sources{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:16px}.health-source-list{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.health-chip{padding:7px 10px;border-radius:999px;background:#edf7f4;color:#307c69;font-size:12px}.health-empty{color:#8895a8;font-size:12px}@media(max-width:850px){.health-metrics{grid-template-columns:repeat(2,1fr)}.health-grid{grid-template-columns:1fr}.health-hero,.health-sources,.health-access{align-items:flex-start;flex-direction:column}.health-permissions{margin-left:0}.health-source-list{justify-content:flex-start}}`;
  document.head.appendChild(healthStyle);
  const spiderStyle = document.createElement('style');
  spiderStyle.textContent = `
    .spider-view{display:none;max-width:1180px;margin:0 auto}.spider-shell{overflow:hidden;border:1px solid #263b55;border-radius:12px;background:#101b2c;box-shadow:0 20px 55px #00000036}.spider-topbar{display:flex;align-items:center;gap:24px;padding:17px 21px;border-bottom:1px solid #263b55}.spider-topbar h2{margin:1px 0 0;font-size:20px}.spider-eyebrow{color:#79a4e6;font-size:10px;font-weight:800;letter-spacing:.13em}.spider-stats{display:flex;gap:19px;margin-left:auto;color:#9caec6;font-size:12px}.spider-stats b{margin-left:5px;color:#f1d68b;font-size:15px}.spider-actions{display:flex;gap:8px}.spider-icon{width:35px;border:1px solid #344965;border-radius:7px;background:#15233a;color:#e3edf8;font-size:21px;cursor:pointer}.spider-table{position:relative;min-height:565px;padding:21px;background:radial-gradient(ellipse at center,#17594c 0%,#0d3d38 56%,#092f2d 100%)}.spider-stock-area{position:absolute;top:21px;left:21px;display:grid;gap:4px;text-align:center;color:#d6e5e3;font-size:11px}.spider-stock{position:relative;width:70px;height:94px;border:2px solid #d7e5df;border-radius:7px;background:repeating-linear-gradient(45deg,#274e7d 0 5px,#183b65 5px 10px);box-shadow:4px 4px 0 #153653,8px 8px 0 #102d47;color:#d5eaf5;font-size:30px;cursor:pointer}.spider-stock:disabled{opacity:.35;cursor:not-allowed}.spider-foundation{position:absolute;top:23px;right:24px;display:flex;gap:9px}.spider-completed{width:45px;height:62px;display:grid;place-items:center;border:1px solid #d9c67c;border-radius:5px;background:#f6e8b3;color:#27364d;font-size:21px}.spider-columns{display:grid;grid-template-columns:repeat(10,minmax(65px,1fr));gap:10px;padding-top:131px}.spider-column{position:relative;min-height:370px}.spider-card{position:absolute;left:0;width:100%;height:92px;padding:6px 8px;border:1px solid #d9e0e7;border-radius:6px;background:linear-gradient(135deg,#fff,#e8edf2);box-shadow:0 2px 5px #001a17aa;color:#172539;font:700 17px Georgia,serif;cursor:pointer;user-select:none}.spider-card .suit{display:block;font-size:20px;line-height:1}.spider-card.face-down{background:repeating-linear-gradient(45deg,#254c78 0 5px,#1c3e68 5px 10px);border-color:#83a3c8;color:transparent}.spider-card.selected{outline:3px solid #f4d365;outline-offset:-3px;filter:brightness(1.06)}.spider-toast{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);padding:7px 12px;border-radius:6px;background:#092522de;color:#e4f4df;font-size:12px;opacity:0;transition:opacity .2s;pointer-events:none}.spider-toast.show{opacity:1}@media(max-width:1050px){.spider-view{min-width:920px}.spider-table{min-height:540px}.spider-columns{gap:7px}.spider-topbar{padding:14px}.spider-stock-area{left:14px}}`;
  document.head.appendChild(spiderStyle);
  const rulesStyle = document.createElement('style');
  rulesStyle.textContent = '.rules-view{display:none}.rules-shell{min-height:540px;display:grid;grid-template-columns:minmax(250px,.8fr) minmax(360px,1fr);gap:28px;align-items:center;padding:32px;border:1px solid #dae4f3;border-radius:18px;background:linear-gradient(135deg,#fff,#f3f7ff)}.rules-eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:#4774cf}.rules-copy h2{margin:12px 0 10px;font-size:30px;color:#17243b}.rules-copy p{max-width:360px;line-height:1.8;color:#6c7a92}.game-stats{display:flex;gap:12px;margin:24px 0}.game-stats div{min-width:112px;padding:12px 14px;border:1px solid #dce6f7;border-radius:11px;background:#fff}.game-stats span{display:block;color:#8090aa;font-size:12px}.game-stats b{display:block;margin-top:5px;color:#255fc5;font-size:23px}.game-actions{display:flex;gap:10px}.game-actions button{margin:0}.game-tip{display:block;margin-top:15px;color:#8290a5}.game-board-wrap{position:relative;justify-self:center;width:360px;height:360px;border-radius:16px;overflow:hidden;background:#0d1830;box-shadow:0 16px 35px #244a8a33}.game-board-wrap canvas{display:block;width:100%;height:100%}.game-state{position:absolute;inset:auto 16px 16px;text-align:center;padding:8px;border-radius:8px;background:#081326c9;color:#dceaff;font-size:12px;pointer-events:none}@media(max-width:800px){.rules-shell{grid-template-columns:1fr}.game-board-wrap{width:min(360px,100%);height:auto;aspect-ratio:1}.rules-copy h2{font-size:25px}}';
  document.head.appendChild(rulesStyle);
  let snakeTimer, snake = [], snakeFood, snakeDirection = {x:1,y:0}, nextSnakeDirection = {x:1,y:0}, snakeScore = 0, snakeRunning = false;
  const snakeSize = 18, snakeCanvas = $('#snake-board'), snakeContext = snakeCanvas.getContext('2d');
  function placeFood(){do{snakeFood={x:Math.floor(Math.random()*snakeSize),y:Math.floor(Math.random()*snakeSize)}}while(snake.some(p=>p.x===snakeFood.x&&p.y===snakeFood.y))}
  function drawSnake(){const cell=snakeCanvas.width/snakeSize;snakeContext.fillStyle='#0d1830';snakeContext.fillRect(0,0,snakeCanvas.width,snakeCanvas.height);snakeContext.strokeStyle='#1b2b4b';for(let i=1;i<snakeSize;i+=1){snakeContext.beginPath();snakeContext.moveTo(i*cell,0);snakeContext.lineTo(i*cell,snakeCanvas.height);snakeContext.stroke();snakeContext.beginPath();snakeContext.moveTo(0,i*cell);snakeContext.lineTo(snakeCanvas.width,i*cell);snakeContext.stroke()}snakeContext.fillStyle='#f5c452';snakeContext.beginPath();snakeContext.arc((snakeFood.x+.5)*cell,(snakeFood.y+.5)*cell,cell*.29,0,Math.PI*2);snakeContext.fill();snake.forEach((p,i)=>{snakeContext.fillStyle=i===0?'#70e0c5':'#3975df';snakeContext.fillRect(p.x*cell+2,p.y*cell+2,cell-4,cell-4)})}
  function endSnake(message){snakeRunning=false;window.clearInterval(snakeTimer);$('#snake-state').textContent=message;$('#snake-start').textContent='再玩一次'}
  function tickSnake(){snakeDirection=nextSnakeDirection;const head={x:snake[0].x+snakeDirection.x,y:snake[0].y+snakeDirection.y};if(head.x<0||head.y<0||head.x>=snakeSize||head.y>=snakeSize||snake.some(p=>p.x===head.x&&p.y===head.y)){endSnake(`游戏结束，得分 ${snakeScore}`);return}snake.unshift(head);if(head.x===snakeFood.x&&head.y===snakeFood.y){snakeScore+=1;$('#snake-score').textContent=snakeScore;const best=Math.max(Number(localStorage.getItem('codeguard-snake-best')||0),snakeScore);localStorage.setItem('codeguard-snake-best',String(best));$('#snake-best').textContent=best;placeFood()}else{snake.pop()}drawSnake()}
  function resetSnake(){window.clearInterval(snakeTimer);snake=[{x:9,y:9},{x:8,y:9},{x:7,y:9}];snakeDirection={x:1,y:0};nextSnakeDirection={x:1,y:0};snakeScore=0;snakeRunning=false;$('#snake-score').textContent='0';$('#snake-best').textContent=localStorage.getItem('codeguard-snake-best')||'0';$('#snake-state').textContent='点击“开始”';$('#snake-start').textContent='开始';placeFood();drawSnake()}
  function startSnake(){if(snakeRunning){endSnake('已暂停，点击“开始”继续');return}snakeRunning=true;$('#snake-state').textContent='游戏进行中 · 方向键 / WASD 控制';$('#snake-start').textContent='暂停游戏';window.clearInterval(snakeTimer);snakeTimer=window.setInterval(tickSnake,125)}
  function showRules(){reviewGrid.style.display='none';historyView.style.display='none';chatView.style.display='none';spiderView.style.display='none';healthView.style.display='none';rulesView.style.display='block';pageTitle.textContent='规则配置';pageSubtitle.textContent='管理扫描策略，也可在实验室中放松片刻。';navigation.forEach(item=>item.classList.remove('active'));navigation[3].classList.add('active');if(!snake.length)resetSnake()}
  let spiderColumns = [], spiderStock = [], spiderCompleted = 0, spiderMoves = 0, spiderSelection = null, spiderHistory = [];

  function makeSpiderDeck() {
    const deck = [];
    for (let set = 0; set < 8; set += 1) for (let value = 13; value >= 1; value -= 1) deck.push({ value, id: `${set}-${value}` });
    for (let i = deck.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
    return deck;
  }
  function spiderSnapshot() { return JSON.stringify({ columns: spiderColumns, stock: spiderStock, completed: spiderCompleted, moves: spiderMoves }); }
  function showSpiderToast(message) { const toast = $('#spider-toast'); toast.textContent = message; toast.classList.add('show'); window.clearTimeout(showSpiderToast.timer); showSpiderToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1500); }
  function isSpiderRun(cards, start) { for (let i = start; i < cards.length - 1; i += 1) if (!cards[i].faceUp || cards[i].value !== cards[i + 1].value + 1) return false; return cards[start] && cards[start].faceUp; }
  function cardLabel(value) { return ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' })[value] || value; }
  function checkSpiderCompletion(columnIndex) {
    const pile = spiderColumns[columnIndex];
    if (pile.length < 13 || !isSpiderRun(pile, pile.length - 13) || pile[pile.length - 13].value !== 13 || pile[pile.length - 1].value !== 1) return;
    pile.splice(-13); spiderCompleted += 1;
    if (pile.length) pile[pile.length - 1].faceUp = true;
    showSpiderToast(spiderCompleted === 8 ? '全部牌组已完成！' : '已自动收走一组同花顺');
  }
  function renderSpider() {
    const root = $('#spider-columns'); root.innerHTML = '';
    spiderColumns.forEach((pile, columnIndex) => {
      const column = document.createElement('div'); column.className = 'spider-column'; column.dataset.column = columnIndex;
      pile.forEach((card, cardIndex) => {
        const item = document.createElement('button'); item.type = 'button'; item.className = `spider-card${card.faceUp ? '' : ' face-down'}${spiderSelection && spiderSelection.from === columnIndex && cardIndex >= spiderSelection.start ? ' selected' : ''}`;
        item.style.top = `${cardIndex * (card.faceUp ? 28 : 17)}px`; item.dataset.card = cardIndex;
        if (card.faceUp) item.innerHTML = `${cardLabel(card.value)}<span class="suit">♠</span>`;
        item.addEventListener('click', () => selectSpiderCard(columnIndex, cardIndex)); column.appendChild(item);
      });
      column.addEventListener('click', (event) => { if (event.target === column) selectSpiderColumn(columnIndex); }); root.appendChild(column);
    });
    $('#spider-stock-count').textContent = `剩余 ${spiderStock.length} 叠`; $('#spider-stock').disabled = !spiderStock.length;
    $('#spider-moves').textContent = spiderMoves; $('#spider-complete').textContent = spiderCompleted;
    $('#spider-foundation').innerHTML = Array.from({ length: spiderCompleted }, () => '<div class="spider-completed">♠</div>').join('');
  }
  function resetSpider() {
    const deck = makeSpiderDeck(); spiderColumns = Array.from({ length: 10 }, () => []);
    for (let column = 0; column < 10; column += 1) { const count = column < 4 ? 6 : 5; for (let i = 0; i < count; i += 1) spiderColumns[column].push({ ...deck.pop(), faceUp: i === count - 1 }); }
    spiderStock = Array.from({ length: 5 }, () => deck.splice(-10)); spiderCompleted = 0; spiderMoves = 0; spiderSelection = null; spiderHistory = []; renderSpider();
  }
  function selectSpiderCard(columnIndex, cardIndex) {
    const pile = spiderColumns[columnIndex];
    if (!pile[cardIndex].faceUp) { if (cardIndex === pile.length - 1) { spiderHistory.push(spiderSnapshot()); pile[cardIndex].faceUp = true; spiderMoves += 1; renderSpider(); } return; }
    if (spiderSelection) { selectSpiderColumn(columnIndex); return; }
    if (!isSpiderRun(pile, cardIndex)) { showSpiderToast('只能移动连续的降序牌'); return; }
    spiderSelection = { from: columnIndex, start: cardIndex }; renderSpider();
  }
  function selectSpiderColumn(target) {
    if (!spiderSelection) return;
    const { from, start } = spiderSelection;
    if (from === target) { spiderSelection = null; renderSpider(); return; }
    const moving = spiderColumns[from].slice(start), destination = spiderColumns[target], last = destination[destination.length - 1];
    if (last && (!last.faceUp || last.value !== moving[0].value + 1)) { showSpiderToast('目标牌必须比移动牌大一级'); return; }
    spiderHistory.push(spiderSnapshot()); spiderColumns[from].splice(start); destination.push(...moving);
    if (spiderColumns[from].length) spiderColumns[from][spiderColumns[from].length - 1].faceUp = true;
    spiderMoves += 1; spiderSelection = null; checkSpiderCompletion(target); renderSpider();
  }
  function dealSpider() {
    if (!spiderStock.length) return;
    if (spiderColumns.some((pile) => !pile.length)) { showSpiderToast('发牌前请先填满所有列'); return; }
    spiderHistory.push(spiderSnapshot()); const batch = spiderStock.pop(); batch.forEach((card, column) => spiderColumns[column].push({ ...card, faceUp: true })); spiderMoves += 1;
    spiderColumns.forEach((_, index) => checkSpiderCompletion(index)); renderSpider();
  }
  function undoSpider() {
    const snapshot = spiderHistory.pop(); if (!snapshot) { showSpiderToast('暂无可撤销的操作'); return; }
    const state = JSON.parse(snapshot); spiderColumns = state.columns; spiderStock = state.stock; spiderCompleted = state.completed; spiderMoves = state.moves; spiderSelection = null; renderSpider();
  }
  function showSpider() {
    healthView.style.display = 'none';
    reviewGrid.style.display = 'none'; historyView.style.display = 'none'; chatView.style.display = 'none'; rulesView.style.display = 'none'; spiderView.style.display = 'block';
    pageTitle.textContent = '蜘蛛纸牌'; pageSubtitle.textContent = '单花色经典玩法，完成八组从 K 到 A 的同花顺。'; navigation.forEach(item => item.classList.remove('active')); navigation[4].classList.add('active'); if (!spiderColumns.length) resetSpider();
  }
  const healthKey = 'codeguard-health-records';
  const healthRoleKey = 'codeguard-health-role';
  const healthRoles = {
    owner: { label: '所有者', description: '可查看、录入数据并管理访问权限。', permissions: ['read', 'write', 'manage'] },
    recorder: { label: '记录员', description: '可查看和录入健康数据，不能管理权限。', permissions: ['read', 'write'] },
    viewer: { label: '访客', description: '仅可查看健康数据，不能新增或覆盖记录。', permissions: ['read'] }
  };
  const healthDate = $('#health-date');

  function currentHealthRole() {
    const role = localStorage.getItem(healthRoleKey) || 'owner';
    return healthRoles[role] ? role : 'viewer';
  }
  function canHealth(action) { return healthRoles[currentHealthRole()].permissions.includes(action); }
  function renderHealthAccess() {
    const role = currentHealthRole();
    const definition = healthRoles[role];
    $('#health-role').value = role;
    $('#health-role-description').textContent = definition.description;
    $('#health-permissions').innerHTML = [
      ['read', '查看数据'], ['write', '录入数据'], ['manage', '管理权限']
    ].map(([permission, label]) => `<span class="health-permission${definition.permissions.includes(permission) ? '' : ' denied'}">${label}</span>`).join('');
    const formPanel = $('#health-form').closest('.health-panel');
    formPanel.classList.toggle('health-readonly', !canHealth('write'));
    formPanel.querySelectorAll('input, select, button').forEach((control) => { control.disabled = !canHealth('write'); });
    $('#health-demo').disabled = !canHealth('write');
  }

  function healthRecords() {
    try { return JSON.parse(localStorage.getItem(healthKey) || '[]'); } catch { return []; }
  }
  function saveHealthRecords(records) { localStorage.setItem(healthKey, JSON.stringify(records)); }
  function dateLabel(date) { return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(new Date(`${date}T12:00:00`)).replace('周', ''); }
  function renderHealth() {
    renderHealthAccess();
    const records = healthRecords().sort((a, b) => a.date.localeCompare(b.date));
    const newest = records[records.length - 1];
    $('#health-steps').textContent = newest?.steps ? newest.steps.toLocaleString() : '--';
    $('#health-steps-note').textContent = newest ? `${newest.date} · ${newest.source}` : '等待记录';
    $('#health-sleep').textContent = newest?.sleep ? `${newest.sleep} h` : '--';
    $('#health-sleep-note').textContent = newest?.sleep ? (newest.sleep >= 7 ? '睡眠充足' : '建议早点休息') : '等待记录';
    $('#health-mood').textContent = newest?.mood || '--';
    $('#health-mood-note').textContent = newest?.mood ? `${newest.date} 的感受` : '尚未填写';
    const lastSeven = records.slice(-7);
    $('#health-streak').textContent = `${lastSeven.length} 天`;
    $('#health-bars').innerHTML = lastSeven.length ? lastSeven.map((item) => `<div class="health-day"><div class="health-columns"><i style="height:${Math.max(6, Math.min(100, Number(item.steps || 0) / 100))}%"></i><b style="height:${Math.max(6, Math.min(100, Number(item.sleep || 0) / 10 * 100))}%"></b></div><span>${dateLabel(item.date)}</span></div>`).join('') : '<div class="health-empty">添加第一条记录后，这里会显示你的近 7 天趋势。</div>';
    const sources = [...new Set(records.map((item) => item.source).filter(Boolean))];
    $('#health-source-list').innerHTML = sources.length ? sources.map((source) => `<span class="health-chip">✓ ${source}</span>`).join('') : '<span class="health-empty">尚未接入数据来源</span>';
  }
  function showHealth() {
    reviewGrid.style.display = 'none'; historyView.style.display = 'none'; chatView.style.display = 'none'; rulesView.style.display = 'none'; spiderView.style.display = 'none'; healthView.style.display = 'block';
    pageTitle.textContent = '健康生活'; pageSubtitle.textContent = '将分散的睡眠、活动和生活记录汇总到一个私密面板。'; navigation.forEach(item => item.classList.remove('active')); navigation[5].classList.add('active'); renderHealth();
  }
  navigation[2].textContent = '✦　AI 对话';

  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(historyKey) || '[]');
    } catch {
      return [];
    }
  }

  function saveHistory(issues, score) {
    const records = getHistory();
    records.unshift({
      id: Date.now(),
      language: languageSelect.value,
      score,
      issues: issues.length,
      high: issues.filter((issue) => issue.severity === 'high').length,
      createdAt: new Date().toISOString()
    });
    localStorage.setItem(historyKey, JSON.stringify(records.slice(0, 30)));
  }

  function renderHistory() {
    const list = $('#history-list');
    const records = getHistory();
    if (!records.length) {
      list.innerHTML = '<div class="history-empty">还没有评审记录。完成一次代码评审后，结果会自动显示在这里。</div>';
      return;
    }
    list.innerHTML = records.map((record) => {
      const time = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.createdAt));
      return '<article class="history-item"><div><h3>' + escapeHtml(record.language) + '</h3><p>' + time + ' · 发现 ' + record.issues + ' 个问题</p></div><span class="history-risk">' + record.high + ' 个高风险</span><span class="history-score">' + record.score + '</span></article>';
    }).join('');
  }

  function showHistory() {
    healthView.style.display = 'none';
    reviewGrid.style.display = 'none';
    rulesView.style.display = 'none';
    spiderView.style.display = 'none';
    historyView.style.display = 'block';
    chatView.style.display = 'none';
    pageTitle.textContent = '评审历史';
    pageSubtitle.textContent = '查看本浏览器保存的代码评审记录。';
    navigation.forEach((item) => item.classList.remove('active'));
    navigation[1].classList.add('active');
    navigation[2].classList.remove('active');
    renderHistory();
  }

  function showReview() {
    healthView.style.display = 'none';
    historyView.style.display = 'none';
    chatView.style.display = 'none';
    rulesView.style.display = 'none';
    spiderView.style.display = 'none';
    reviewGrid.style.display = '';
    pageTitle.textContent = '智能代码评审';
    pageSubtitle.textContent = '让每一次提交，都更可靠、更易维护。';
    navigation.forEach((item) => item.classList.remove('active'));
    navigation[0].classList.add('active');
    navigation[2].classList.remove('active');
  }

  function addChatMessage(role, message) {
    const messages = $('#chat-messages');
    const welcome = messages.querySelector('.chat-welcome');
    if (welcome) {
      welcome.remove();
    }
    const item = document.createElement('div');
    item.className = 'chat-message ' + role;
    item.innerHTML = '<div class="chat-avatar">' + (role === 'user' ? '你' : '✦') + '</div><div class="chat-bubble">' + escapeHtml(message) + '</div>';
    messages.appendChild(item);
    messages.scrollTop = messages.scrollHeight;
  }

  function getChatReply(question) {
    const value = question.toLowerCase();
    if (/安全|密码|密钥|注入|security/.test(value)) {
      return '可以先从输入边界、身份验证、密钥管理和依赖漏洞四个方向检查。把相关代码贴过来，我会按风险优先级说明。';
    }
    if (/性能|慢|优化|performance/.test(value)) {
      return '性能问题通常先确认热点路径、数据库查询次数、网络请求与大对象分配。请贴出函数和调用频率，我会给出可验证的优化建议。';
    }
    if (/历史|记录/.test(value)) {
      return '每次完成评审后，结果会保存在“评审历史”中。记录仅存于当前浏览器，可随时清空。';
    }
    return '我已理解你的问题。这个本地原型可以先基于规则协助分析；如果你粘贴具体代码，我会指出可读性、安全性和可维护性风险。';
  }

  async function sendChat() {
    const input = $('#chat-input');
    const question = input.value.trim();
    if (!question) {
      return;
    }
    addChatMessage('user', question);
    chatHistory.push({ role: 'user', text: question });
    input.value = '';
    const sendButton = $('#chat-send');
    sendButton.disabled = true;
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory.slice(-12) })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gemini 请求失败');
      }
      addChatMessage('assistant', data.reply);
      chatHistory.push({ role: 'assistant', text: data.reply });
    } catch (error) {
      addChatMessage('assistant', '暂时无法连接 Gemini。请确认本地服务正在运行，且 .env 中的 GEMINI_API_KEY 有效。');
    } finally {
      sendButton.disabled = false;
    }
  }

  function showChat() {
    healthView.style.display = 'none';
    reviewGrid.style.display = 'none';
    historyView.style.display = 'none';
    rulesView.style.display = 'none';
    spiderView.style.display = 'none';
    chatView.style.display = 'block';
    pageTitle.textContent = 'AI 对话';
    pageSubtitle.textContent = '面向代码质量与安全的本地智能助手。';
    navigation.forEach((item) => item.classList.remove('active'));
    navigation[2].classList.add('active');
    $('#chat-input').focus();
  }

  function updateLineNumbers() {
    const count = Math.max(1, codeInput.value.split('\n').length);
    lineNumbers.textContent = Array.from({ length: count }, (_, index) => index + 1).join('\n');
  }

  const escapeHtml = (value) => value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[character]);

  function lineOf(source, index) {
    return source.slice(0, index).split('\n').length;
  }

  function findIssues(source) {
    const rules = [
      {
        pattern: /jwt\.(sign|encode)\([\s\S]{0,160}?['"][^'"]+['"]/gi,
        severity: 'high',
        title: '敏感信息不应硬编码',
        description: 'JWT 签名密钥应来自环境变量或密钥管理服务，避免提交到版本库。'
      },
      {
        pattern: /(password|passwd)\s*(===|==|!=|!==)\s*/gi,
        severity: 'high',
        title: '密码比较方式不安全',
        description: '请使用 bcrypt、argon2 等算法验证密码哈希，避免直接比较密码。'
      },
      {
        pattern: /\b(eval|exec)\s*\(/gi,
        severity: 'high',
        title: '存在动态执行风险',
        description: '动态执行字符串可能导致代码注入。请使用显式的白名单逻辑替代。'
      },
      {
        pattern: /\b(SELECT|INSERT|UPDATE|DELETE)\b[\s\S]{0,100}?(\+|\$\{|%s)/gi,
        severity: 'high',
        title: '疑似 SQL 注入',
        description: '请改用参数化查询或 ORM 参数绑定，避免拼接用户输入。'
      },
      {
        pattern: /console\.(log|debug)\s*\(/gi,
        severity: 'medium',
        title: '遗留调试日志',
        description: '生产代码中建议使用统一日志模块，并避免输出敏感数据。'
      },
      {
        pattern: /catch\s*\([^)]*\)\s*\{\s*\}/gi,
        severity: 'medium',
        title: '异常被静默忽略',
        description: '请记录、转换或重新抛出异常，避免问题被隐藏。'
      },
      {
        pattern: /\bTODO\b|\bFIXME\b/gi,
        severity: 'low',
        title: '存在待处理标记',
        description: '建议在合并前确认该待办是否需要转为任务或完成处理。'
      }
    ];

    const issues = [];
    for (const rule of rules) {
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(source);
      if (match) {
        issues.push({ ...rule, line: lineOf(source, match.index) });
      }
    }

    if (/\.findOne\([^)]*\)[\s\S]{0,180}?\.[a-zA-Z_]/.test(source) && !/if\s*\(\s*!?user\s*\)/.test(source)) {
      const match = /\.findOne\(/.exec(source);
      issues.push({
        severity: 'medium',
        title: '缺少空值保护',
        description: '查询结果可能为空；访问属性前请验证对象是否存在。',
        line: lineOf(source, match.index)
      });
    }

    return issues.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]));
  }

  function render(issues) {
    const high = issues.filter((item) => item.severity === 'high').length;
    const medium = issues.filter((item) => item.severity === 'medium').length;
    const score = Math.max(20, 100 - high * 20 - medium * 9 - (issues.length - high - medium) * 4);
    const scoreText = score >= 85 ? '优秀' : score >= 65 ? '良好' : '需要关注';
    const rows = issues.length ? issues.map((issue) => `
      <div class="issue">
        <i class="bar ${issue.severity === 'high' ? 'high' : ''}"></i>
        <div><h4>${escapeHtml(issue.title)}</h4><p>${escapeHtml(issue.description)}</p></div>
        <span class="line">第 ${issue.line} 行</span>
      </div>`).join('') : '<div class="issue"><i class="bar"></i><div><h4>未发现常见风险</h4><p>本地规则扫描未发现安全或质量问题。仍建议结合测试和人工评审。</p></div><span class="line">通过</span></div>';

    result.innerHTML = `
      <div class="score"><b>${score}</b><div><strong>代码健康度：${scoreText}</strong><br><small>${issues.length ? `发现 ${issues.length} 个值得关注的问题` : '本地规则扫描已通过'}</small></div></div>
      ${rows}`;
    empty.style.display = 'none';
    result.style.display = 'block';
    status.textContent = '评审完成';

    const metrics = document.querySelectorAll('.metric b');
    if (metrics.length === 3) {
      metrics[0].textContent = high;
      metrics[1].textContent = medium + issues.filter((item) => item.severity === 'low').length;
      metrics[2].textContent = issues.length ? `${Math.max(2, issues.length * 2)}s` : '0s';
    }
    return score;
  }

  function review() {
    const source = codeInput.value.trim();
    if (!source) {
      status.textContent = '请输入代码';
      codeInput.focus();
      return;
    }
    reviewButton.disabled = true;
    reviewButton.textContent = '正在本地扫描…';
    status.textContent = `扫描 ${languageSelect.value}`;
    window.setTimeout(() => {
      const issues = findIssues(source);
      const score = render(issues);
      saveHistory(issues, score);
      reviewButton.disabled = false;
      reviewButton.textContent = '✦ 开始智能评审';
    }, 280);
  }

  reviewButton.onclick = review;
  navigation[0].addEventListener('click', showReview);
  navigation[1].addEventListener('click', showHistory);
  navigation[2].addEventListener('click', showChat);
  navigation[3].addEventListener('click', showRules);
  navigation[4].addEventListener('click', showSpider);
  navigation[5].addEventListener('click', showHealth);
  $('#snake-start').addEventListener('click', startSnake);
  $('#snake-reset').addEventListener('click', resetSnake);
  $('#spider-stock').addEventListener('click', dealSpider);
  $('#spider-new').addEventListener('click', resetSpider);
  $('#spider-undo').addEventListener('click', undoSpider);
  healthDate.value = new Date().toISOString().slice(0, 10);
  $('#health-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!canHealth('write')) { window.alert('当前身份只有查看权限，无法保存健康记录。'); return; }
    const date = healthDate.value;
    if (!date) return;
    const records = healthRecords().filter((item) => item.date !== date);
    records.push({
      date,
      source: $('#health-source').value,
      steps: Number($('#health-steps-input').value) || 0,
      sleep: Number($('#health-sleep-input').value) || 0,
      mood: $('#health-mood-input').value
    });
    saveHealthRecords(records); renderHealth();
    $('#health-steps-input').value = ''; $('#health-sleep-input').value = ''; $('#health-mood-input').value = '';
  });
  $('#health-demo').addEventListener('click', () => {
    if (!canHealth('write')) { window.alert('当前身份没有载入数据的权限。'); return; }
    const today = new Date();
    const demo = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today); day.setDate(today.getDate() - (6 - index));
      return { date: day.toISOString().slice(0, 10), source: index % 2 ? '运动手表导入' : '睡眠 App 导入', steps: 5200 + index * 710, sleep: Number((6.4 + (index % 3) * 0.55).toFixed(1)), mood: ['一般', '不错', '很好'][index % 3] };
    });
    saveHealthRecords(demo); renderHealth();
  });
  $('#health-role').addEventListener('change', (event) => {
    const nextRole = event.target.value;
    if (!healthRoles[nextRole]) return;
    // This local selector simulates signing in as another role; actual role assignment
    // remains an owner-only capability represented by the `manage` permission.
    localStorage.setItem(healthRoleKey, nextRole);
    renderHealth();
  });
  document.addEventListener('keydown', (event) => {
    if (rulesView.style.display !== 'block') return;
    const directions = {
      ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 }
    };
    if (event.code === 'Space') { event.preventDefault(); startSnake(); return; }
    const direction = directions[event.key];
    if (direction && !(direction.x === -snakeDirection.x && direction.y === -snakeDirection.y)) {
      event.preventDefault(); nextSnakeDirection = direction;
    }
  });
  $('#chat-send').addEventListener('click', sendChat);
  $('#chat-input').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  });
  $('#clear-history').addEventListener('click', () => {
    localStorage.removeItem(historyKey);
    renderHistory();
  });
  codeInput.addEventListener('input', updateLineNumbers);
  codeInput.addEventListener('scroll', () => {
    lineNumbers.style.transform = `translateY(${-codeInput.scrollTop}px)`;
  });
  document.onkeydown = (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      review();
    }
  };
  updateLineNumbers();
})();
