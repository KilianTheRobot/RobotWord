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


// Waffen: Laser (Start), Schwert (Nahkampf), Super-Pistole (Fernkampf)
const weapons = [
	{ name: 'Laser', type: 'ranged', color: '#00eaff', speed: 8, size: 6, damage: 1, cooldown: 20 },
	{ name: 'Schwert', type: 'melee', color: '#ff8800', damage: 2, cooldown: 25 },
	{ name: 'Super-Pistole', type: 'ranged', color: '#fff700', speed: 14, size: 12, damage: 2, cooldown: 10 },
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
			hp: 3, // Immer 3 Treffer nötig, außer mit Spezialwaffen
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
				// Super-Pistole macht 2 Schaden, Laser 1
				let dmg = weapons[weaponLevel-1].damage;
				e.hp -= dmg;
				b.x = -1000; // Entferne Bullet
				if (e.hp <= 0) e.alive = false;
			}
		});
	});
}

function checkSwordHit() {
	// Nur wenn aktuelle Waffe Schwert ist
	if (weapons[weaponLevel-1].type !== 'melee' || player.shootCooldown > 0) return;
	let hit = false;
	enemies.forEach(e => {
		if (e.alive && rectsCollide({x: player.x+player.w-10, y: player.y+10, w: 30, h: 20}, e)) {
			e.hp -= weapons[weaponLevel-1].damage;
			hit = true;
			if (e.hp <= 0) e.alive = false;
		}
	});
	if (hit) player.shootCooldown = weapons[weaponLevel-1].cooldown;
}

function rectsCollide(a, b) {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function shoot() {
	if (!player.canShoot || player.shootCooldown > 0) return;
	const weapon = weapons[weaponLevel-1];
		if (weapon.type === 'ranged') {
			bullets.push({
				x: player.x + player.w,
				y: player.y + player.h/2 - 2,
				w: weapon.size,
				h: 4,
				speed: weapon.speed,
				color: weapon.color,
				size: weapon.size
			});
			player.shootCooldown = weapon.cooldown;
		}
}

function nextLevel() {
	level++;
	// Waffen abwechselnd: Schwert, Super-Pistole, Schwert, ...
	if (weaponLevel < weapons.length) {
		weaponLevel++;
	} else {
		weaponLevel = 2 + ((level-2)%2); // 2=Schwert, 3=Super-Pistole
	}
	spawnEnemies();
	updateUI();
	gameActive = true;
}

function updateUI() {
	levelInfo.textContent = `Level: ${level}`;
	let waffe = weapons[weaponLevel-1].name;
	if (weapons[weaponLevel-1].type === 'melee') {
		waffe += ' (Taste F für Nahkampf)';
	} else {
		waffe += ' (Leertaste für Schuss)';
	}
	weaponInfo.textContent = `Waffe: ${waffe}`;
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
	if (e.key.toLowerCase() === 'f') checkSwordHit();
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
