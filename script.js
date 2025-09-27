// --- Spiel-Setup ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelInfo = document.getElementById('levelInfo');
const weaponInfo = document.getElementById('weaponInfo');

// --- Spielzustand ---
let level = 1;
let weaponLevel = 1;
let gameActive = true;

const player = {
	x: 100,
	y: 250,
	w: 40,
	h: 40,
	speed: 4,
	color: '#ff3333',
	dx: 0,
	dy: 0,
	canShoot: true,
	shootCooldown: 0,
};

let enemies = [];
let bullets = [];
let keys = {};

const weapons = [
	{ name: 'Laser', color: '#00eaff', speed: 8, size: 6, damage: 1, cooldown: 20 },
	{ name: 'Doppel-Laser', color: '#00ff6a', speed: 10, size: 7, damage: 2, cooldown: 15 },
	{ name: 'Plasma', color: '#ff00e1', speed: 13, size: 10, damage: 3, cooldown: 12 },
	{ name: 'Hyperstrahl', color: '#fff700', speed: 16, size: 13, damage: 5, cooldown: 8 },
];

function spawnEnemies() {
	enemies = [];
	for (let i = 0; i < level + 2; i++) {
		enemies.push({
			x: 700 + Math.random() * 80,
			y: 60 + Math.random() * 380,
			w: 36,
			h: 36,
			color: '#6cf',
			alive: true,
			hp: 1 + Math.floor(level/2),
		});
	}
}

function drawPlayer() {
	ctx.fillStyle = player.color;
	ctx.fillRect(player.x, player.y, player.w, player.h);
	// Roboter-Auge
	ctx.fillStyle = '#fff';
	ctx.fillRect(player.x + 28, player.y + 15, 8, 8);
}

function drawEnemies() {
	enemies.forEach(e => {
		if (e.alive) {
			ctx.fillStyle = e.color;
			ctx.fillRect(e.x, e.y, e.w, e.h);
			ctx.fillStyle = '#222';
			ctx.fillRect(e.x + 24, e.y + 12, 6, 6);
		}
	});
}

function drawBullets() {
	bullets.forEach(b => {
		ctx.fillStyle = b.color;
		ctx.fillRect(b.x, b.y, b.size, 4);
	});
}

function updatePlayer() {
	player.x += player.dx * player.speed;
	player.y += player.dy * player.speed;
	// Begrenzung
	player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));
	player.y = Math.max(0, Math.min(canvas.height - player.h, player.y));
	if (player.shootCooldown > 0) player.shootCooldown--;
}

function updateBullets() {
	bullets.forEach(b => b.x += b.speed);
	// Entferne Bullets außerhalb
	bullets = bullets.filter(b => b.x < canvas.width && b.x > -20);
}

function updateEnemies() {
	enemies.forEach(e => {
		if (!e.alive) return;
		// Gegner bewegen sich auf den Spieler zu
		if (e.x > player.x) e.x -= 1 + level * 0.2;
		if (e.y < player.y) e.y += 0.7;
		if (e.y > player.y) e.y -= 0.7;
		// Kollision mit Spieler
		if (rectsCollide(player, e)) {
			gameOver();
		}
	});
}

function checkBulletHits() {
	bullets.forEach(b => {
		enemies.forEach(e => {
			if (e.alive && rectsCollide(b, e)) {
				e.hp -= weapons[weaponLevel-1].damage;
				b.x = -1000; // Entferne Bullet
				if (e.hp <= 0) e.alive = false;
			}
		});
	});
}

function rectsCollide(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function shoot() {
	if (!player.canShoot || player.shootCooldown > 0) return;
	const weapon = weapons[weaponLevel-1];
	if (weaponLevel === 2) {
		// Doppel-Laser
		bullets.push({ x: player.x + player.w, y: player.y + 8, speed: weapon.speed, color: weapon.color, size: weapon.size });
		bullets.push({ x: player.x + player.w, y: player.y + player.h - 12, speed: weapon.speed, color: weapon.color, size: weapon.size });
	} else {
		bullets.push({ x: player.x + player.w, y: player.y + player.h/2 - 2, speed: weapon.speed, color: weapon.color, size: weapon.size });
	}
	player.shootCooldown = weapon.cooldown;
}

function nextLevel() {
	level++;
	if (weaponLevel < weapons.length) weaponLevel++;
	spawnEnemies();
	updateUI();
}

function updateUI() {
	levelInfo.textContent = `Level: ${level}`;
	weaponInfo.textContent = `Waffe: ${weapons[weaponLevel-1].name}`;
}

function gameOver() {
	gameActive = false;
	setTimeout(() => {
		alert('GAME OVER! Du warst nicht böse genug.');
		window.location.reload();
	}, 300);
}

function gameLoop() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!gameActive) return;
	updatePlayer();
	updateBullets();
	updateEnemies();
	checkBulletHits();
	drawPlayer();
	drawEnemies();
	drawBullets();
	// Prüfe, ob alle Gegner tot
	if (enemies.every(e => !e.alive)) {
		setTimeout(() => {
			if (gameActive) nextLevel();
		}, 800);
		gameActive = false;
	}
	requestAnimationFrame(gameLoop);
}

// --- Steuerung ---
document.addEventListener('keydown', e => {
	keys[e.key.toLowerCase()] = true;
	if (e.key === ' ') shoot();
});
document.addEventListener('keyup', e => {
	keys[e.key.toLowerCase()] = false;
});

function handleInput() {
	player.dx = (keys['d'] ? 1 : 0) - (keys['a'] ? 1 : 0);
	player.dy = (keys['s'] ? 1 : 0) - (keys['w'] ? 1 : 0);
	setTimeout(handleInput, 16);
}

// --- Start ---
function startGame() {
	level = 1;
	weaponLevel = 1;
	gameActive = true;
	player.x = 100;
	player.y = 250;
	bullets = [];
	spawnEnemies();
	updateUI();
	handleInput();
	gameLoop();
}

startGame();
