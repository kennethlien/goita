// Goita - P2P Implementation

// ===================
// AUDIO
// ===================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Unlock audio context on first user interaction
function unlockAudio() {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  document.removeEventListener('click', unlockAudio);
  document.removeEventListener('keydown', unlockAudio);
}
document.addEventListener('click', unlockAudio);
document.addEventListener('keydown', unlockAudio);

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

const sounds = {
  select: () => playTone(600, 0.08, 'sine', 0.2),
  deselect: () => playTone(400, 0.08, 'sine', 0.15),
  play: () => {
    playTone(523, 0.1, 'sine', 0.25);  // C5
    setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 80);  // E5
  },
  pass: () => playTone(300, 0.15, 'triangle', 0.2),
  yourTurn: () => {
    playTone(523, 0.12, 'sine', 0.3);  // C5
    setTimeout(() => playTone(659, 0.12, 'sine', 0.3), 100);  // E5
    setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 200);  // G5
  },
  win: () => {
    playTone(523, 0.15, 'sine', 0.3);
    setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 120);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 240);
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.35), 360);
  },
  lose: () => {
    playTone(400, 0.2, 'sine', 0.25);
    setTimeout(() => playTone(350, 0.2, 'sine', 0.25), 150);
    setTimeout(() => playTone(300, 0.3, 'sine', 0.2), 300);
  },
  error: () => playTone(200, 0.15, 'square', 0.15),
  gameStart: () => {
    playTone(392, 0.1, 'sine', 0.25);  // G4
    setTimeout(() => playTone(523, 0.1, 'sine', 0.25), 100);  // C5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 200);  // E5
  }
};

// ===================
// TILE DEFINITIONS
// ===================
const TILE_TYPES = {
  MEW:     { symbol: '王', name: 'King',   shortName: 'Mew',       pokemon: 'Mew',       sprite: 'mew.gif',       points: 50, count: 1, isKing: true },
  MEWTWO:  { symbol: '王', name: 'King',   shortName: 'Mewtwo',    pokemon: 'Mewtwo',    sprite: 'mewtwo.gif',    points: 50, count: 1, isKing: true },
  ROOK:    { symbol: '飛', name: 'Rook',   shortName: 'Charizard', pokemon: 'Charizard', sprite: 'charizard.gif', points: 40, count: 2 },
  BISHOP:  { symbol: '角', name: 'Bishop', shortName: 'Dragonite', pokemon: 'Dragonite', sprite: 'dragonite.gif', points: 40, count: 2 },
  GOLD:    { symbol: '金', name: 'Gold',   shortName: 'Raichu',    pokemon: 'Raichu',    sprite: 'raichu.gif',    points: 30, count: 4 },
  SILVER:  { symbol: '銀', name: 'Silver', shortName: 'Pikachu',   pokemon: 'Pikachu',   sprite: 'pikachu.gif',   points: 30, count: 4 },
  KNIGHT:  { symbol: '馬', name: 'Knight', shortName: 'Ponyta',    pokemon: 'Ponyta',    sprite: 'ponyta.gif',    points: 20, count: 4 },
  LANCE:   { symbol: '香', name: 'Lance',  shortName: 'Rattata',   pokemon: 'Rattata',   sprite: 'rattata.gif',   points: 20, count: 4 },
  PAWN:    { symbol: 'し', name: 'Pawn',   shortName: 'Pidgey',    pokemon: 'Pidgey',    sprite: 'pidgey.gif',    points: 10, count: 10 }
};

function isKing(type) {
  return TILE_TYPES[type]?.isKing === true;
}

function renderTile(tile, extraClasses = '') {
  const info = TILE_TYPES[tile.type];
  return `<div class="tile ${extraClasses}" data-id="${tile.id}" data-type="${tile.type}">
    <span class="tile-count">×${info.count}</span>
    <img class="sprite" src="sprites/${info.sprite}" alt="${info.pokemon}">
    <span class="pokemon-name">${info.shortName}</span>
    <span class="tile-role">${info.symbol} ${info.name}</span>
    <span class="tile-points">${info.points}pt</span>
  </div>`;
}

function renderFaceDownTile() {
  return `<div class="tile face-down"></div>`;
}

function renderPlayedFaceDown(tile = null) {
  if (tile) {
    // My own face-down tile - can hover to reveal
    const info = TILE_TYPES[tile.type];
    return `<div class="tile played-face-down mine" data-id="${tile.id}" data-type="${tile.type}">
      <span class="tile-count">×${info.count}</span>
      <img class="sprite" src="sprites/${info.sprite}" alt="${info.pokemon}">
      <span class="pokemon-name">${info.shortName}</span>
      <span class="tile-role">${info.symbol} ${info.name}</span>
      <span class="tile-points">${info.points}pt</span>
    </div>`;
  }
  // Someone else's face-down tile
  return `<div class="tile played-face-down"></div>`;
}

function renderEmptySlot() {
  return `<div class="tile empty-slot"></div>`;
}

function createDeck() {
  const deck = [];
  let id = 0;
  for (const [type, info] of Object.entries(TILE_TYPES)) {
    for (let i = 0; i < info.count; i++) {
      deck.push({ id: id++, type, ...info });
    }
  }
  return deck;
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ===================
// GAME STATE
// ===================
let state = {
  phase: 'lobby', // lobby, playing, roundEnd, gameEnd
  players: [],    // [{id, name, hand[], played[], isHost}]
  scores: [0, 0], // Team A (players 0,2), Team B (players 1,3)
  currentPlayer: 0,
  dealer: 0,
  lastAttack: null,      // {type, playerIndex}
  consecutivePasses: 0,
  kingPlayed: false,
  freePlay: false        // true when playing after 3 passes
};

let myIndex = -1;
let peer = null;
let connections = [];
let previousTurnPlayer = null;

// ===================
// NETWORKING
// ===================
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function getRoomFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
}

function createGame() {
  const name = (document.getElementById('host-name-input').value.trim() || 'Player 1').toUpperCase();
  const roomId = generateRoomId();
  const peerId = `goita-${roomId}`;

  peer = new Peer(peerId);

  peer.on('open', () => {
    myIndex = 0;
    state.players = [{ id: peerId, name: name, isHost: true }];

    const url = `${window.location.pathname}?room=${roomId}`;
    history.pushState({ room: roomId }, '', url);
    document.getElementById('room-code').textContent = roomId;
    document.getElementById('room-info').classList.remove('hidden');
    document.getElementById('game-info').classList.remove('hidden');
    document.getElementById('create-section').classList.add('hidden');
    document.getElementById('waiting-section').classList.remove('hidden');
    updatePlayerList();
  });

  peer.on('connection', (conn) => {
    if (state.players.length >= 4 || state.phase !== 'lobby') {
      conn.on('open', () => {
        conn.send({ type: 'roomFull' });
        setTimeout(() => conn.close(), 100);
      });
      return;
    }

    conn.on('open', () => {
      connections.push(conn);

      conn.on('data', (data) => handleMessage(conn, data));
      conn.on('close', () => handleDisconnect(conn));
    });
  });

  peer.on('error', (err) => {
    console.error('Peer error:', err);
    alert('Connection error. Please refresh and try again.');
  });
}

function joinGame(roomId, name) {
  const peerId = `goita-${roomId}-${generateRoomId()}`;
  peer = new Peer(peerId);

  peer.on('open', () => {
    const conn = peer.connect(`goita-${roomId}`);

    conn.on('open', () => {
      connections = [conn];
      conn.send({ type: 'join', name: name || 'Player' });

      conn.on('data', (data) => {
        if (data.type === 'roomFull') {
          showRoomError('This game is full or already in progress.');
          return;
        }
        handleMessage(conn, data);
      });
      conn.on('close', () => {
        if (state.phase === 'lobby') {
          showRoomError('Disconnected from host.');
        }
      });
    });

    conn.on('error', () => {
      showRoomError('Could not connect to game.');
    });
  });
}

function broadcast(message) {
  connections.forEach(conn => {
    if (conn.open) conn.send(message);
  });
}

function sendToHost(message) {
  if (connections[0] && connections[0].open) {
    connections[0].send(message);
  }
}

function handleMessage(conn, data) {
  switch (data.type) {
    case 'join':
      if (myIndex === 0) {
        const playerIndex = state.players.length;
        state.players.push({ id: conn.peer, name: data.name, isHost: false });
        conn.playerIndex = playerIndex;

        // Send current state to new player
        conn.send({ type: 'welcome', playerIndex, players: state.players });

        // Notify all players
        broadcast({ type: 'playerJoined', players: state.players });
        updatePlayerList();
      }
      break;

    case 'welcome':
      myIndex = data.playerIndex;
      state.players = data.players;
      document.getElementById('room-code').textContent = getRoomFromUrl();
      document.getElementById('room-info').classList.remove('hidden');
      document.getElementById('game-info').classList.remove('hidden');
      document.getElementById('join-section').classList.add('hidden');
      document.getElementById('waiting-section').classList.remove('hidden');
      updatePlayerList();
      break;

    case 'playerJoined':
      state.players = data.players;
      updatePlayerList();
      break;

    case 'startGame':
      state = { ...state, ...data.state };
      startGameUI();
      break;

    case 'stateUpdate':
      state = { ...state, ...data.state };
      renderGame();
      break;

    case 'play':
      if (myIndex === 0) {
        handlePlay(conn.playerIndex, data.defense, data.attack);
      }
      break;

    case 'pass':
      if (myIndex === 0) {
        handlePass(conn.playerIndex);
      }
      break;

    case 'roundEnd':
      showRoundEnd(data.winner, data.points, data.scores);
      break;

    case 'nextRound':
      state = { ...state, ...data.state };
      renderGame();
      hideOverlay();
      break;

    case 'log':
      if (data.action === 'play') {
        logPlay(data.playerName, data.defense, data.attack, data.isFirstPlay);
        sounds.play();  // Play sound when opponent plays
      } else if (data.action === 'pass') {
        logPass(data.playerName);
        sounds.pass();  // Play sound when opponent passes
      } else if (data.action === 'roundStart') {
        logRoundStart(data.dealerName);
      } else if (data.action === 'roundEnd') {
        logRoundEnd(data.teamName, data.points);
      } else if (data.action === 'message') {
        logAction(data.message);
      }
      break;

    case 'redealChoice':
      if (myIndex === 0) {
        // Host receives choice from partner
        handleRedealChoice(data.choice);
      } else {
        // Client receives broadcast to show overlay
        showRedealChoice(data.partner, data.playerName);
      }
      break;

    case 'roomFull':
      showRoomError('This game is full or already in progress.');
      break;
  }
}

function handleDisconnect(conn) {
  const idx = connections.indexOf(conn);
  if (idx > -1) connections.splice(idx, 1);

  if (myIndex === 0 && state.phase === 'lobby') {
    state.players = state.players.filter(p => p.id !== conn.peer);
    broadcast({ type: 'playerJoined', players: state.players });
    updatePlayerList();
  }
}

// ===================
// GAME LOGIC
// ===================
function dealCards() {
  const deck = shuffle(createDeck());
  for (let i = 0; i < 4; i++) {
    state.players[i].hand = deck.slice(i * 8, (i + 1) * 8);
    state.players[i].played = [];
  }
}

function checkInstantWin() {
  // Check for pawn-based instant wins
  for (let i = 0; i < 4; i++) {
    const hand = state.players[i].hand;
    const pawnCount = hand.filter(t => t.type === 'PAWN').length;

    if (pawnCount === 8) {
      return { player: i, points: 100, reason: '8 pawns' };
    }
    if (pawnCount === 7) {
      const other = hand.find(t => t.type !== 'PAWN');
      return { player: i, points: other.points * 2, reason: '7 pawns' };
    }
    if (pawnCount === 6) {
      const others = hand.filter(t => t.type !== 'PAWN');
      if (others[0].type === others[1].type) {
        return { player: i, points: others[0].points * 2, reason: '6 pawns (pair)' };
      }
      return { player: i, points: Math.max(others[0].points, others[1].points), reason: '6 pawns' };
    }
  }

  // Check for double 5 pawns (partners)
  const p0Pawns = state.players[0].hand.filter(t => t.type === 'PAWN').length;
  const p2Pawns = state.players[2].hand.filter(t => t.type === 'PAWN').length;
  if (p0Pawns === 5 && p2Pawns === 5) {
    return { team: 0, points: 150, reason: 'Double 5 pawns' };
  }

  const p1Pawns = state.players[1].hand.filter(t => t.type === 'PAWN').length;
  const p3Pawns = state.players[3].hand.filter(t => t.type === 'PAWN').length;
  if (p1Pawns === 5 && p3Pawns === 5) {
    return { team: 1, points: 150, reason: 'Double 5 pawns' };
  }

  // Check for single 5 pawns (partner gets to choose redeal)
  for (let i = 0; i < 4; i++) {
    const pawnCount = state.players[i].hand.filter(t => t.type === 'PAWN').length;
    const partnerIndex = (i + 2) % 4;
    const partnerPawns = state.players[partnerIndex].hand.filter(t => t.type === 'PAWN').length;
    if (pawnCount === 5 && partnerPawns !== 5) {
      return { type: 'redealChoice', player: i, partner: partnerIndex };
    }
  }

  return null;
}

function startRound() {
  dealCards();
  const dealerName = state.players[state.dealer].name;
  logRoundStart(dealerName);
  broadcast({ type: 'log', action: 'roundStart', dealerName });

  const instantWin = checkInstantWin();
  if (instantWin) {
    // Handle redeal choice for single 5 pawns
    if (instantWin.type === 'redealChoice') {
      state.phase = 'redealChoice';
      state.redealData = instantWin;
      const playerName = state.players[instantWin.player].name;
      broadcast({
        type: 'redealChoice',
        player: instantWin.player,
        partner: instantWin.partner,
        playerName
      });
      showRedealChoice(instantWin.partner, playerName);
      return;
    }

    const team = instantWin.team !== undefined ? instantWin.team : (instantWin.player % 2);
    state.scores[team] += instantWin.points;

    broadcast({
      type: 'roundEnd',
      winner: team,
      points: instantWin.points,
      scores: state.scores,
      reason: instantWin.reason
    });
    showRoundEnd(team, instantWin.points, state.scores, instantWin.reason);
    return;
  }

  state.phase = 'playing';
  state.currentPlayer = state.dealer;
  state.lastAttack = null;
  state.consecutivePasses = 0;
  state.kingPlayed = false;
  state.freePlay = false;

  broadcastState();
  renderGame();
}

function canMatch(defenseType, attackType) {
  if (defenseType === attackType) return true;
  // Kings match each other
  if (isKing(defenseType) && isKing(attackType)) return true;
  // Kings are wild (except against Lance and Pawn)
  if (isKing(defenseType) && attackType !== 'LANCE' && attackType !== 'PAWN') return true;
  return false;
}

function canPlayAsAttack(type) {
  if (!isKing(type)) return true;
  if (state.kingPlayed) return true;

  const hand = state.players[state.currentPlayer].hand;

  // Allow if it's the winning play (only 2 cards left)
  if (hand.length === 2) return true;

  // Check if player has both kings
  const kingCount = hand.filter(t => isKing(t.type)).length;
  return kingCount === 2;
}

function handlePlay(playerIndex, defenseId, attackId) {
  if (playerIndex !== state.currentPlayer) return;

  const player = state.players[playerIndex];
  const defense = player.hand.find(t => t.id === defenseId);
  const attack = player.hand.find(t => t.id === attackId);

  if (!defense || !attack) return;

  // Validate the play
  if (state.lastAttack) {
    if (!canMatch(defense.type, state.lastAttack.type)) return;
  }
  if (!canPlayAsAttack(attack.type)) return;

  // Execute the play
  const isFirstPlay = state.lastAttack === null;
  player.hand = player.hand.filter(t => t.id !== defenseId && t.id !== attackId);
  player.played.push({ defense, attack, faceDown: isFirstPlay });

  // Track if a King has appeared face-up (attack, or defense when not first play)
  if (isKing(attack.type)) state.kingPlayed = true;
  if (isKing(defense.type) && !isFirstPlay) state.kingPlayed = true;

  // Log the play
  logPlay(player.name, defense, attack, isFirstPlay);
  broadcast({ type: 'log', action: 'play', playerName: player.name, defense, attack, isFirstPlay });

  state.lastAttack = { type: attack.type, playerIndex };
  state.consecutivePasses = 0;

  // Check for win (check freePlay before resetting it)
  if (player.hand.length === 0) {
    endRound(playerIndex, attack);
    state.freePlay = false;
    return;
  }

  state.freePlay = false;  // Reset after play (if not winning)
  advanceTurn();
  broadcastState();
}

function handlePass(playerIndex) {
  if (playerIndex !== state.currentPlayer) return;
  if (!state.lastAttack) return; // Can't pass on opening

  const playerName = state.players[playerIndex].name;
  logPass(playerName);
  broadcast({ type: 'log', action: 'pass', playerName });
  state.consecutivePasses++;

  // If 3 passes, back to attacker who can play freely
  if (state.consecutivePasses >= 3) {
    state.currentPlayer = state.lastAttack.playerIndex;
    state.lastAttack = null;
    state.consecutivePasses = 0;
    state.freePlay = true;  // Mark that next play is after 3 passes
  } else {
    advanceTurn();
  }

  broadcastState();
}

function advanceTurn() {
  // Counter-clockwise: 0 -> 3 -> 2 -> 1 -> 0
  state.currentPlayer = (state.currentPlayer + 3) % 4;
}

function endRound(winnerIndex, lastTile) {
  const team = winnerIndex % 2;
  let points = lastTile.points;

  // Check for double score (same defense and attack after 3 passes)
  const lastPlay = state.players[winnerIndex].played.slice(-1)[0];
  if (lastPlay && lastPlay.defense.type === lastPlay.attack.type && state.freePlay) {
    points *= 2;
  }

  state.scores[team] += points;
  state.dealer = winnerIndex;

  const teamName = team === 0 ? 'Team A' : 'Team B';
  logRoundEnd(teamName, points);
  broadcast({ type: 'log', action: 'roundEnd', teamName, points });

  broadcast({
    type: 'roundEnd',
    winner: team,
    points,
    scores: state.scores
  });
  showRoundEnd(team, points, state.scores);
}

function broadcastState() {
  // Send state with hidden hands for opponents
  for (const conn of connections) {
    const playerIndex = conn.playerIndex;
    const visibleState = createVisibleState(playerIndex);
    conn.send({ type: 'stateUpdate', state: visibleState });
  }
  renderGame();
}

function createVisibleState(forPlayer) {
  return {
    phase: state.phase,
    players: state.players.map((p, i) => ({
      name: p.name,
      hand: i === forPlayer ? p.hand : p.hand.map(() => ({ hidden: true })),
      played: p.played,
      handCount: p.hand.length
    })),
    scores: state.scores,
    currentPlayer: state.currentPlayer,
    dealer: state.dealer,
    lastAttack: state.lastAttack,
    consecutivePasses: state.consecutivePasses,
    kingPlayed: state.kingPlayed,
    freePlay: state.freePlay
  };
}

// ===================
// ACTION LOG
// ===================
function logAction(message) {
  const log = document.getElementById('action-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = message;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

function getTileName(tile) {
  const info = TILE_TYPES[tile.type];
  return `${info.pokemon} (${info.name})`;
}

function logPlay(playerName, defense, attack, isFirstPlay) {
  const defenseText = isFirstPlay ? '?' : `<span class="tile-symbol">${defense.symbol}</span> ${getTileName(defense)}`;
  const attackText = `<span class="tile-symbol">${attack.symbol}</span> ${getTileName(attack)}`;
  logAction(`<span class="player">${playerName}</span> played ${defenseText} → ${attackText}`);
}

function logPass(playerName) {
  logAction(`<span class="player">${playerName}</span> passed`);
}

function logRoundStart(dealerName) {
  logAction(`— Round start (${dealerName} deals) —`);
}

function logRoundEnd(teamName, points) {
  logAction(`<strong>${teamName} wins +${points}</strong>`);
}

function clearLog() {
  document.getElementById('action-log').innerHTML = '';
}

// ===================
// UI
// ===================
function updatePlayerList() {
  const count = state.players.length;
  const playerCountEl = document.getElementById('player-count');
  if (playerCountEl) playerCountEl.textContent = count;

  const list = document.getElementById('players');
  const gameStarted = state.currentPlayer !== undefined && state.currentPlayer !== null;
  list.innerHTML = state.players.map((p, i) => {
    const team = i % 2 === 0 ? 'A' : 'B';
    const isYou = i === myIndex;
    const youClass = isYou ? ' you' : '';
    const youLabel = isYou ? ' (you)' : '';
    let turnStatus = '';
    if (gameStarted) {
      const isPlaying = state.currentPlayer === i;
      const isUpNext = ((state.currentPlayer + 3) % 4) === i;
      turnStatus = isPlaying ? '<span class="turn-status">Playing</span>' : (isUpNext ? '<span class="turn-status">Up Next</span>' : '');
    }
    return `<li><span class="player-pill team-${team.toLowerCase()}${youClass}">${p.name}${youLabel}</span>${turnStatus}</li>`;
  }).join('');

  const startBtn = document.getElementById('start-btn');
  const waitingText = document.querySelector('#waiting-section > p');

  if (count === 4) {
    if (myIndex === 0) {
      waitingText.textContent = 'All players joined!';
      startBtn.classList.remove('hidden');
    } else {
      waitingText.textContent = 'Waiting for host to start game...';
      startBtn.classList.add('hidden');
    }
  } else {
    waitingText.innerHTML = `Waiting for players... <span id="player-count">${count}</span>/4`;
    startBtn.classList.add('hidden');
  }
}

function startGameUI() {
  document.getElementById('lobby').classList.add('hidden');
  document.getElementById('game').classList.remove('hidden');
  document.getElementById('game-info').classList.remove('hidden');
  document.getElementById('selection-legend').classList.remove('hidden');
  sounds.gameStart();
  renderGame();
}

function renderGame() {
  // Play sound when it becomes my turn
  if (state.currentPlayer === myIndex && previousTurnPlayer !== myIndex && previousTurnPlayer !== null) {
    sounds.yourTurn();
  }
  previousTurnPlayer = state.currentPlayer;

  document.getElementById('score-a').textContent = state.scores[0];
  document.getElementById('score-b').textContent = state.scores[1];
  updatePlayerList();

  // Position mapping: 0=bottom (me), 1=right, 2=top (partner), 3=left
  const positions = ['bottom', 'right', 'top', 'left'];

  for (let offset = 0; offset < 4; offset++) {
    const playerIndex = (myIndex + offset) % 4;
    const player = state.players[playerIndex];
    if (!player) continue;

    const position = positions[offset];
    const area = document.getElementById(`player-${position}`);
    const teamLabel = playerIndex % 2 === 0 ? 'A' : 'B';

    // Player name with team and turn status
    const nameEl = area.querySelector('.player-name');
    const isCurrentTurn = state.currentPlayer === playerIndex;
    const isUpNext = ((state.currentPlayer + 3) % 4) === playerIndex;
    const turnStatus = isCurrentTurn ? ' • Playing' : (isUpNext ? ' • Up Next' : '');
    const isYou = offset === 0;
    const youClass = isYou ? ' you' : '';
    const youLabel = isYou ? ' (you)' : '';
    nameEl.innerHTML = `<span class="player-pill team-${teamLabel.toLowerCase()}${youClass}">${player.name}${youLabel}</span>${turnStatus}`;

    const cardsLeft = player.handCount || (player.hand ? player.hand.length : 0);
    const cardsLeftEl = area.querySelector('.cards-left');
    cardsLeftEl.textContent = `${cardsLeft} cards`;

    // Current turn indicator
    area.classList.toggle('current-turn', isCurrentTurn);

    // Render defense and attack rows (4 slots each)
    const defenseRow = area.querySelector('.defense-row');
    const attackRow = area.querySelector('.attack-row');
    const played = player.played || [];

    let defenseHtml = '';
    let attackHtml = '';

    for (let i = 0; i < 4; i++) {
      if (i < played.length) {
        const pair = played[i];
        const isMyPlay = offset === 0;
        if (pair.faceDown) {
          defenseHtml += isMyPlay ? renderPlayedFaceDown(pair.defense) : renderPlayedFaceDown();
        } else {
          defenseHtml += renderTile(pair.defense);
        }
        attackHtml += renderTile(pair.attack);
      } else {
        defenseHtml += renderEmptySlot();
        attackHtml += renderEmptySlot();
      }
    }

    defenseRow.innerHTML = defenseHtml;
    attackRow.innerHTML = attackHtml;
  }

  // Render my hand
  const myHand = document.getElementById('my-hand');
  const player = state.players[myIndex];
  const hand = player?.hand || [];
  const tilesEl = myHand.querySelector('.player-tiles');
  tilesEl.innerHTML = hand.map(t => renderTile(t, 'selectable')).join('');

  // Game status
  const statusEl = document.getElementById('game-status');
  if (state.currentPlayer === myIndex) {
    if (state.lastAttack) {
      const attackInfo = TILE_TYPES[state.lastAttack.type];
      statusEl.textContent = `Match ${attackInfo.symbol} ${attackInfo.pokemon} (${attackInfo.name}) — select defense first`;
    } else {
      statusEl.textContent = 'Select your defense tile';
    }
  } else {
    statusEl.textContent = `Waiting for ${state.players[state.currentPlayer]?.name}...`;
  }

  // Enable/disable action buttons based on turn
  const isMyTurn = state.currentPlayer === myIndex;
  document.getElementById('pass-btn').disabled = !isMyTurn || !state.lastAttack;

  // Add click handlers
  setupTileSelection();
}

let selectedDefense = null;
let selectedAttack = null;

function setupTileSelection() {
  const tiles = document.querySelectorAll('#my-hand .player-tiles .tile');

  tiles.forEach(tile => {
    tile.addEventListener('contextmenu', (e) => e.preventDefault());
    tile.addEventListener('click', () => handleTileClick(tile));
  });
}

function handleTileClick(tile) {
  if (state.currentPlayer !== myIndex) return;

  const id = parseInt(tile.dataset.id);
  const type = tile.dataset.type;
  const player = state.players[myIndex];

  // Already selected this tile
  if (id === selectedDefense || id === selectedAttack) {
    return;
  }

  // If no defense selected yet, select as defense
  if (selectedDefense === null) {
    // Validate defense selection
    if (state.lastAttack && !canMatch(type, state.lastAttack.type)) {
      const lastInfo = TILE_TYPES[state.lastAttack.type];
      const tileInfo = TILE_TYPES[type];
      showInvalidTile(tile, `Can't match ${lastInfo.pokemon} with ${tileInfo.pokemon}`);
      return;
    }

    selectedDefense = id;
    tile.classList.add('selected-defense');
    sounds.select();
  }
  // If defense selected but no attack, select as attack
  else if (selectedAttack === null) {
    // Validate attack selection (King restrictions)
    if (isKing(type) && !state.kingPlayed) {
      const isWinningPlay = player.hand.length === 2;
      const kingCount = player.hand.filter(t => isKing(t.type)).length;
      if (!isWinningPlay && kingCount < 2) {
        showInvalidTile(tile, 'Need both Kings to attack with King first');
        return;
      }
    }

    selectedAttack = id;
    tile.classList.add('selected-attack');
    sounds.select();
  }

  updateActionButtons();
  updateGameStatus();
}

function showInvalidTile(tile, message) {
  tile.classList.add('invalid');
  setTimeout(() => tile.classList.remove('invalid'), 300);
  sounds.error();

  const statusEl = document.getElementById('game-status');
  statusEl.textContent = message;
  statusEl.classList.add('error');
  setTimeout(() => {
    statusEl.classList.remove('error');
    updateGameStatus();
  }, 1500);
}

function updateActionButtons() {
  const confirmBtn = document.getElementById('confirm-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  if (selectedDefense !== null && selectedAttack !== null) {
    confirmBtn.disabled = false;
    cancelBtn.disabled = false;
  } else if (selectedDefense !== null) {
    confirmBtn.disabled = true;
    cancelBtn.disabled = false;
  } else {
    confirmBtn.disabled = true;
    cancelBtn.disabled = true;
  }
}

function updateGameStatus() {
  if (state.currentPlayer !== myIndex) return;

  const statusEl = document.getElementById('game-status');

  if (selectedDefense !== null && selectedAttack !== null) {
    statusEl.textContent = 'Ready — click Confirm';
  } else if (selectedDefense !== null) {
    statusEl.textContent = 'Now select your attack tile';
  } else if (state.lastAttack) {
    const attackInfo = TILE_TYPES[state.lastAttack.type];
    statusEl.textContent = `Match ${attackInfo.symbol} ${attackInfo.pokemon} (${attackInfo.name}) — select defense first`;
  } else {
    statusEl.textContent = 'Select your defense tile';
  }
}

function confirmPlay() {
  if (selectedDefense === null || selectedAttack === null) return;

  sounds.play();

  if (myIndex === 0) {
    handlePlay(0, selectedDefense, selectedAttack);
  } else {
    sendToHost({ type: 'play', defense: selectedDefense, attack: selectedAttack });
  }

  clearSelection(false);  // Don't play deselect sound after play
}

function cancelSelection() {
  clearSelection();
  renderGame();
}

function clearSelection(playSound = true) {
  const hadSelection = selectedDefense !== null || selectedAttack !== null;
  selectedDefense = null;
  selectedAttack = null;
  document.querySelectorAll('.tile.selected-defense, .tile.selected-attack').forEach(t => {
    t.classList.remove('selected-defense', 'selected-attack');
  });
  updateActionButtons();
  if (playSound && hadSelection) sounds.deselect();
}

function pass() {
  sounds.pass();

  if (myIndex === 0) {
    handlePass(0);
  } else {
    sendToHost({ type: 'pass' });
  }
}

function showRoundEnd(team, points, scores, reason) {
  state.phase = 'roundEnd';
  const overlay = document.getElementById('game-over');
  const winnerText = document.getElementById('winner-text');
  const finalScore = document.getElementById('final-score');

  const teamName = team === 0 ? 'Team A' : 'Team B';
  winnerText.textContent = `${teamName} wins the round!`;
  finalScore.textContent = `+${points} points${reason ? ` (${reason})` : ''}\nTeam A: ${scores[0]} | Team B: ${scores[1]}`;

  // Play win/lose sound based on my team
  const myTeam = myIndex % 2;
  if (team === myTeam) {
    sounds.win();
  } else {
    sounds.lose();
  }

  overlay.classList.remove('hidden');

  // Check for game end
  if (scores[0] >= 150 || scores[1] >= 150) {
    const winner = scores[0] >= 150 ? 'Team A' : 'Team B';
    winnerText.textContent = `${winner} wins the game!`;
    document.getElementById('next-round-btn').textContent = 'New Game';
    document.getElementById('next-round-btn').onclick = () => location.reload();
  }
}

function hideOverlay() {
  document.getElementById('game-over').classList.add('hidden');
  document.getElementById('redeal-overlay').classList.add('hidden');
}

function nextRound() {
  if (myIndex === 0) {
    startRound();
    broadcast({ type: 'nextRound', state: createVisibleState(-1) });
  }
  hideOverlay();
}

function showRedealChoice(partnerIndex, playerName) {
  const overlay = document.getElementById('redeal-overlay');
  const text = document.getElementById('redeal-text');

  if (partnerIndex === myIndex) {
    text.textContent = `${playerName} has 5 pawns. Do you want to play or redeal?`;
    document.getElementById('redeal-play-btn').disabled = false;
    document.getElementById('redeal-redeal-btn').disabled = false;
  } else {
    text.textContent = `${playerName} has 5 pawns. Waiting for partner to decide...`;
    document.getElementById('redeal-play-btn').disabled = true;
    document.getElementById('redeal-redeal-btn').disabled = true;
  }

  overlay.classList.remove('hidden');
}

function handleRedealChoice(choice) {
  hideOverlay();
  if (myIndex === 0) {
    if (choice === 'redeal') {
      logAction('Partner chose to redeal');
      broadcast({ type: 'log', action: 'message', message: 'Partner chose to redeal' });
      startRound();  // Redeal
      broadcast({ type: 'nextRound', state: createVisibleState(-1) });
    } else {
      logAction('Partner chose to play');
      broadcast({ type: 'log', action: 'message', message: 'Partner chose to play' });
      // Continue with normal play
      state.phase = 'playing';
      state.currentPlayer = state.dealer;
      state.lastAttack = null;
      state.consecutivePasses = 0;
      state.kingPlayed = false;
      state.freePlay = false;
      // Use nextRound to ensure all clients hide the overlay
      for (const conn of connections) {
        const visibleState = createVisibleState(conn.playerIndex);
        conn.send({ type: 'nextRound', state: visibleState });
      }
      renderGame();
    }
  } else {
    // Send choice to host
    connections[0]?.send({ type: 'redealChoice', choice });
  }
}

// ===================
// INITIALIZATION
// ===================
document.getElementById('create-btn').addEventListener('click', createGame);
document.getElementById('host-name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') createGame();
});

document.getElementById('copy-btn').addEventListener('click', () => {
  const copyBtn = document.getElementById('copy-btn');
  navigator.clipboard.writeText(window.location.href);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => copyBtn.textContent = 'Copy', 1500);
});

function doJoin() {
  const name = (document.getElementById('name-input').value.trim() || 'Player').toUpperCase();
  const roomId = getRoomFromUrl();
  const btn = document.getElementById('join-btn');
  btn.textContent = 'Joining...';
  btn.disabled = true;
  joinGame(roomId, name);
}

document.getElementById('join-btn').addEventListener('click', doJoin);
document.getElementById('name-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') doJoin();
});

document.getElementById('start-btn').addEventListener('click', () => {
  if (myIndex === 0 && state.players.length === 4) {
    startRound();
    for (const conn of connections) {
      const visibleState = createVisibleState(conn.playerIndex);
      conn.send({ type: 'startGame', state: visibleState });
    }
    startGameUI();
  }
});

document.getElementById('pass-btn').addEventListener('click', pass);
document.getElementById('confirm-btn').addEventListener('click', confirmPlay);
document.getElementById('cancel-btn').addEventListener('click', cancelSelection);

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't trigger if typing in an input
  if (e.target.tagName === 'INPUT') return;

  // Only handle game shortcuts when game is active
  if (state.phase !== 'playing') return;

  // 1-8: Select tile by index
  if (e.key >= '1' && e.key <= '8') {
    const index = parseInt(e.key) - 1;
    const tiles = document.querySelectorAll('#my-hand .player-tiles .tile');
    if (index < tiles.length) {
      handleTileClick(tiles[index]);
    }
    return;
  }

  // P: Pass
  if (e.key === 'p' || e.key === 'P') {
    const passBtn = document.getElementById('pass-btn');
    if (!passBtn.disabled) {
      pass();
    }
    return;
  }

  // Enter: Confirm
  if (e.key === 'Enter') {
    const confirmBtn = document.getElementById('confirm-btn');
    if (!confirmBtn.disabled) {
      confirmPlay();
    }
    return;
  }

  // Backspace: Clear selection
  if (e.key === 'Backspace') {
    e.preventDefault();  // Prevent browser back
    cancelSelection();
    return;
  }
});
document.getElementById('next-round-btn').addEventListener('click', nextRound);
document.getElementById('redeal-play-btn').addEventListener('click', () => handleRedealChoice('play'));
document.getElementById('redeal-redeal-btn').addEventListener('click', () => handleRedealChoice('redeal'));

// Check if joining via link
const roomId = getRoomFromUrl();
if (roomId) {
  document.getElementById('create-section').classList.add('hidden');
  document.getElementById('join-section').classList.remove('hidden');
  document.getElementById('join-btn').classList.add('hidden');
  document.getElementById('name-input').classList.add('hidden');

  // Check if room exists
  checkRoomExists(roomId);
}

function checkRoomExists(roomId) {
  const tempPeer = new Peer();

  tempPeer.on('open', () => {
    const conn = tempPeer.connect(`goita-${roomId}`, { reliable: true });

    const timeout = setTimeout(() => {
      conn.close();
      tempPeer.destroy();
      showRoomError('This game is no longer available.');
    }, 5000);

    conn.on('open', () => {
      clearTimeout(timeout);
      conn.close();
      tempPeer.destroy();
      // Room exists, show join form
      document.getElementById('join-status').textContent = 'Enter your name to join:';
      document.getElementById('join-btn').classList.remove('hidden');
      document.getElementById('name-input').classList.remove('hidden');
    });

    conn.on('error', () => {
      clearTimeout(timeout);
      tempPeer.destroy();
      showRoomError('This game is no longer available.');
    });
  });

  tempPeer.on('error', () => {
    showRoomError('Could not connect. Please try again.');
  });
}

function showRoomError(message) {
  document.getElementById('join-section').classList.add('hidden');
  document.getElementById('error-section').classList.remove('hidden');
  document.getElementById('error-message').textContent = message;
}

document.getElementById('create-new-btn').addEventListener('click', () => {
  history.pushState({}, '', window.location.pathname);
  document.getElementById('error-section').classList.add('hidden');
  document.getElementById('create-section').classList.remove('hidden');
});
