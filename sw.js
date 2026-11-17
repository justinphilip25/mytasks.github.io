
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let W, H;

function resize() {
  W = canvas.width = innerWidth;
  H = canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

const $ = id => document.getElementById(id);

let state = "menu";
let score = 0;
let wave = 1;
let time = 0;
let keys = {};
let mouse = { x: 0, y: 0, down: false };

let player;
let bullets = [];
let enemies = [];
let particles = [];
let orbs = [];

let last = 0;
let spawnTimer = 0;
let dashCooldown = 0;

let best = Number(localStorage.getItem("neonBest") || 0);

const upgrades = [
  {
    name: "POWER SHOT",
    description: "Increase damage",
    apply: () => player.damage *= 1.5
  },
  {
    name: "SPEED BOOST",
    description: "Move faster",
    apply: () => player.speed *= 1.25
  },
  {
    name: "RAPID FIRE",
    description: "Shoot faster",
    apply: () => player.rate *= 0.7
  },
  {
    name: "REPAIR",
    description: "Restore health",
    apply: () => player.hp = Math.min(100, player.hp + 40)
  },
  {
    name: "MULTI SHOT",
    description: "Fire extra bullets",
    apply: () => player.multi = Math.min(5, player.multi + 1)
  }
];

function newGame() {
  score = 0;
  wave = 1;
  time = 0;

  bullets = [];
  enemies = [];
  particles = [];
  orbs = [];

  player = {
    x: W / 2,
    y: H / 2,
    hp: 100,
    speed: 240,
    damage: 25,
    rate: .25,
    fire: 0,
    multi: 1,
    invuln: 0
  };

  $("menu").hidden = true;
  $("overScreen").hidden = true;
  $("pauseScreen").hidden = true;
  $("upgradeScreen").hidden = true;
  $("hud").hidden = false;

  state = "playing";
  last = performance.now();
  requestAnimationFrame(loop);
}

function spawnEnemy() {
  let side = Math.floor(Math.random() * 4);

  let x = side === 0 ? -20 :
          side === 1 ? W + 20 :
          Math.random() * W;

  let y = side === 2 ? -20 :
          side === 3 ? H + 20 :
          Math.random() * H;

  let type = Math.random();

  let enemy = {
    x, y,
    hp: type < .7 ? 35 + wave * 4 : 90 + wave * 8,
    max: type < .7 ? 35 + wave * 4 : 90 + wave * 8,
    speed: type < .7 ? 85 + wave * 4 : 55 + wave * 3,
    r: type < .7 ? 12 : 21,
    color: type < .7 ? "#ff4f9a" : "#a78bfa"
  };

  enemies.push(enemy);
}

function shoot() {
  if (player.fire > 0) return;

  let target = enemies[0];

  if (enemies.length) {
    target = enemies.reduce((a, b) =>
      Math.hypot(a.x - player.x, a.y - player.y) <
      Math.hypot(b.x - player.x, b.y - player.y) ? a : b
    );
  }

  let angle = target
    ? Math.atan2(target.y - player.y, target.x - player.x)
    : -Math.PI / 2;

  for (let i = 0; i < player.multi; i++) {
    let offset = (i - (player.multi - 1) / 2) * .13;
    let a = angle + offset;

    bullets.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(a) * 650,
      vy: Math.sin(a) * 650,
      damage: player.damage,
      life: 1.3
    });
  }

  player.fire = player.rate;
}

function burst(x, y, color) {
  for (let i = 0; i < 12; i++) {
    let a = Math.random() * Math.PI * 2;
    let speed = Math.random() * 180;

    particles.push({
      x, y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      life: .5,
      color
    });
  }
}

function damage() {
  if (player.invuln > 0) return;

  player.hp -= 15;
  player.invuln = .6;

  burst(player.x, player.y, "#ff4f9a");

  if (player.hp <= 0) gameOver();
}

function gameOver() {
  state = "over";

  $("hud").hidden = true;
  $("overScreen").hidden = false;

  $("finalScore").textContent = score;

  if (score > best) {
    best = score;
    localStorage.setItem("neonBest", best);
  }

  $("bestScore").textContent = best;
}

function showUpgrade() {
  state = "upgrade";

  $("upgradeScreen").hidden = false;

  let box = $("upgradeChoices");
  box.innerHTML = "";

  let choices = [...upgrades]
    .sort(() => Math.random() - .5)
    .slice(0, 3);

  choices.forEach(upgrade => {
    let button = document.createElement("button");

    button.innerHTML =
      upgrade.name + "<br><small>" +
      upgrade.description + "</small>";

    button.onclick = () => {
      upgrade.apply();
      $("upgradeScreen").hidden = true;
      state = "playing";
      last = performance.now();
      requestAnimationFrame(loop);
    };

    box.appendChild(button);
  });
}

function update(dt) {
  time += dt;

  player.fire -= dt;
  player.invuln -= dt;
  dashCooldown -= dt;

  let dx =
    (keys.d || keys.ArrowRight ? 1 : 0) -
    (keys.a || keys.ArrowLeft ? 1 : 0);

  let dy =
    (keys.s || keys.ArrowDown ? 1 : 0) -
    (keys.w || keys.ArrowUp ? 1 : 0);

  let length = Math.hypot(dx, dy) || 1;

  dx /= length;
  dy /= length;

  player.x = Math.max(15, Math.min(W - 15,
    player.x + dx * player.speed * dt));

  player.y = Math.max(15, Math.min(H - 15,
    player.y + dy * player.speed * dt));

  if (keys[" "] && dashCooldown <= 0) {
    player.x += dx * 100;
    player.y += dy * 100;
    dashCooldown = 2;
    player.invuln = .4;
  }

  player.x = Math.max(15, Math.min(W - 15, player.x));
  player.y = Math.max(15, Math.min(H - 15, player.y));

  if (mouse.down || keys.f || keys.mobileFire) shoot();

  spawnTimer -= dt;

  if (spawnTimer <= 0) {
    spawnEnemy();
    spawnTimer = Math.max(.2, 1 - wave * .06);
  }

  for (let e of enemies) {
    let angle = Math.atan2(
      player.y - e.y,
      player.x - e.x
    );

    e.x += Math.cos(angle) * e.speed * dt;
    e.y += Math.sin(angle) * e.speed * dt;

    if (Math.hypot(e.x - player.x, e.y - player.y)
        < e.r + 12) {
      damage();
      e.x -= Math.cos(angle) * 20;
      e.y -= Math.sin(angle) * 20;
    }
  }

  for (let b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;

    for (let e of enemies) {
      if (e.hp > 0 &&
          Math.hypot(e.x - b.x, e.y - b.y) < e.r + 5) {

        e.hp -= b.damage;
        b.life = 0;

        if (e.hp <= 0) {
          score += 100 + wave * 10;
          burst(e.x, e.y, e.color);

          orbs.push({ x: e.x, y: e.y });
        }

        break;
      }
    }
  }

  bullets = bullets.filter(b =>
    b.life > 0 &&
    b.x > -20 && b.x < W + 20 &&
    b.y > -20 && b.y < H + 20
  );

  enemies = enemies.filter(e => e.hp > 0);

  for (let o of orbs) {
    if (Math.hypot(o.x - player.x, o.y - player.y) < 35) {
      o.got = true;
      player.hp = Math.min(100, player.hp + 1);
      score += 10;
    }
  }

  orbs = orbs.filter(o => !o.got);

  for (let p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
  }

  particles = particles.filter(p => p.life > 0);

  if (score >= wave * 1000) {
    wave++;
    showUpgrade();
  }

  $("score").textContent = score;
  $("wave").textContent = wave;
  $("time").textContent = Math.floor(time);
  $("hpText").textContent = Math.max(0, Math.ceil(player.hp)) + "%";
  $("hpBar").style.width = Math.max(0, player.hp) + "%";
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#080d1c";
  ctx.fillRect(0, 0, W, H);

  // Neon grid
  ctx.strokeStyle = "#1b2b45";
  ctx.lineWidth = 1;

  for (let x = 0; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  for (let y = 0; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Energy orbs
  for (let o of orbs) {
    ctx.fillStyle = "#55fff1";
    ctx.shadowColor = "#55fff1";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.arc(o.x, o.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bullets
  ctx.shadowColor = "#55fff1";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#b5fffa";

  for (let b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enemies
  for (let e of enemies) {
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = e.color;

    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.fillStyle = "#333";
    ctx.fillRect(e.x - e.r, e.y - e.r - 8, e.r * 2, 4);

    ctx.fillStyle = "#55fff1";
    ctx.fillRect(
      e.x - e.r,
      e.y - e.r - 8,
      e.r * 2 * Math.max(0, e.hp / e.max),
      4
    );
  }

  // Particles
  for (let p of particles) {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
  }

  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Player ship
  if (player && state !== "over") {
    ctx.save();
    ctx.translate(player.x, player.y);

    let angle = Math.atan2(
      mouse.y - player.y,
      mouse.x - player.x
    );

    ctx.rotate(angle);

    ctx.shadowColor = "#55fff1";
    ctx.shadowBlur = 25;

    ctx.fillStyle = "#55fff1";

    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-12, -10);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

function loop(now) {
  if (state !== "playing") return;

  let dt = Math.min((now - last) / 1000, .033);
  last = now;

  update(dt);
  draw();

  if (state === "playing") {
    requestAnimationFrame(loop);
  }
}

// Keyboard
addEventListener("keydown", e => {
  keys[e.key] = true;

  if (e.key === "Escape" || e.key === "p") {
    if (state === "playing") {
      state = "paused";
      $("pauseScreen").hidden = false;
    } else if (state === "paused") {
      resume();
    }
  }

  if (e.key === " ") e.preventDefault();
});

addEventListener("keyup", e => keys[e.key] = false);

// Mouse
canvas.addEventListener("mousemove", e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

canvas.addEventListener("mousedown", () => mouse.down = true);
addEventListener("mouseup", () => mouse.down = false);

// Mobile controls
document.querySelectorAll("[data-key]").forEach(btn => {
  let k = btn.dataset.key;

  btn.addEventListener("pointerdown", e => {
    e.preventDefault();
    keys[k] = true;
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach(ev =>
    btn.addEventListener(ev, () => keys[k] = false)
  );
});

$("mobileFire").addEventListener("pointerdown", () => {
  keys.mobileFire = true;
});

["pointerup", "pointerleave", "pointercancel"].forEach(ev =>
  $("mobileFire").addEventListener(ev, () => keys.mobileFire = false)
);

$("mobileDash").addEventListener("pointerdown", () => {
  if (dashCooldown <= 0 && state === "playing") {
    player.invuln = .4;
    dashCooldown = 2;
    let dx = (keys.ArrowRight ? 1 : 0) - (keys.ArrowLeft ? 1 : 0);
    let dy = (keys.ArrowDown ? 1 : 0) - (keys.ArrowUp ? 1 : 0);
    player.x += dx * 100;
    player.y += dy * 100;
  }
});

// Buttons
$("start").onclick = newGame;
$("again").onclick = newGame;

function resume() {
  $("pauseScreen").hidden = true;
  state = "playing";
  last = performance.now();
  requestAnimationFrame(loop);
}

$("resume").onclick = resume;
$("restart").onclick = newGame;
$("pause").onclick = () => {
  if (state === "playing") {
    state = "paused";
    $("pauseScreen").hidden = false;
  }
};

// Initial background
ctx.fillStyle = "#080d1c";
ctx.fillRect(0, 0, W, H);
