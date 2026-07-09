const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const SHIPS = {
    nebulaStar: { name: 'Nebula StarShip', speed: 2, acceleration: 0.3, turnRate: 2, fuel: 1000, fuelConsume: 0.2, color: '#0f0' },
    nebulaPro: { name: 'Nebula ProShip', speed: 3, acceleration: 0.4, turnRate: 2.5, fuel: 800, fuelConsume: 0.25, color: '#0ff' },
    quantamStar: { name: 'QuantamStarship', speed: 5, acceleration: 0.6, turnRate: 3, fuel: 600, fuelConsume: 0.3, color: '#f0f' },
    quantamPro: { name: 'QuantamProShip', speed: 7, acceleration: 0.8, turnRate: 3.5, fuel: 400, fuelConsume: 0.4, color: '#ff0' }
};

const game = {
    ship: null,
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    angle: 0,
    roll: 0,
    fuel: 1000,
    maxFuel: 1000,
    credits: 0,
    level: 1,
    altitude: 0,
    moonVisits: 0,
    keys: {},
    upgrades: { fuel: 0, speed: 0, turnRate: 0 },
    particles: [],
    stars: [],
    moonVisible: false,
    moonX: 0,
    moonY: 0,

    selectShip(shipKey) {
        this.ship = { ...SHIPS[shipKey], key: shipKey };
        this.fuel = this.ship.fuel;
        this.maxFuel = this.ship.fuel;
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.roll = 0;
        this.altitude = 0;
        this.credits = 0;
        this.level = 1;
        this.moonVisits = 0;
        this.particles = [];
        this.upgrades = { fuel: 0, speed: 0, turnRate: 0 };
        document.getElementById('shipSelect').style.display = 'none';
        this.generateStars();
        this.updateUI();
    },

    changeShip() {
        document.getElementById('shipSelect').style.display = 'block';
    },

    generateStars() {
        this.stars = [];
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * canvas.width * 4 - canvas.width * 2,
                y: Math.random() * canvas.height * 4 - canvas.height * 2,
                size: Math.random() * 1.5,
                opacity: Math.random() * 0.7 + 0.3
            });
        }
    },

    buyUpgrade(type) {
        const costs = {
            fuel: 100 * Math.pow(1.5, this.upgrades[type]),
            speed: 150 * Math.pow(1.5, this.upgrades[type]),
            turnRate: 120 * Math.pow(1.5, this.upgrades[type])
        };
        if (this.credits >= costs[type]) {
            this.credits -= costs[type];
            this.upgrades[type]++;
            if (type === 'fuel') this.maxFuel += 200;
            if (type === 'speed') this.ship.speed += 1;
            if (type === 'turnRate') this.ship.turnRate += 0.5;
            this.updateUI();
        }
    },

    update() {
        if (!this.ship) return;

        const speedMult = 1 + (this.upgrades.speed * 0.2);
        const turnMult = 1 + (this.upgrades.turnRate * 0.1);

        // W/A/S/D Movement
        if (this.keys['w']) {
            this.vx += Math.cos(this.angle) * this.ship.acceleration * speedMult;
            this.vy += Math.sin(this.angle) * this.ship.acceleration * speedMult;
        }
        if (this.keys['s']) {
            this.vx -= Math.cos(this.angle) * this.ship.acceleration * speedMult * 0.5;
            this.vy -= Math.sin(this.angle) * this.ship.acceleration * speedMult * 0.5;
        }
        if (this.keys['a']) this.angle -= (this.ship.turnRate * turnMult) * Math.PI / 180;
        if (this.keys['d']) this.angle += (this.ship.turnRate * turnMult) * Math.PI / 180;

        // Q/E Roll - Pure visual effect, no movement
        if (this.keys['q']) this.roll -= 8;
        if (this.keys['e']) this.roll += 8;

        // SPACE Boost - accelerate faster
        if (this.keys[' ']) {
            this.vx *= 1.05;
            this.vy *= 1.05;
            this.fuel -= 2;
        }

        // SHIFT - Suction/Descend - pull downward faster
        if (this.keys['shift']) {
            this.vy += 0.8; // Strong downward pull
            this.fuel -= 1.5;
        }

        // Apply friction
        this.vx *= 0.98;
        this.vy *= 0.98;
        this.roll *= 0.92; // Smooth roll animation

        // Fuel consumption
        if (this.keys['w'] || this.keys['s']) this.fuel -= this.ship.fuelConsume + (this.upgrades.fuel * 0.01);

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Calculate altitude
        this.altitude = Math.sqrt((this.x - canvas.width / 2) ** 2 + (this.y - canvas.height / 2) ** 2);
        if (this.altitude > 3000) this.moonVisible = true;

        // Moon collision
        if (this.moonVisible) {
            const angle = Math.atan2(this.y - canvas.height / 2, this.x - canvas.width / 2);
            this.moonX = canvas.width / 2 + Math.cos(angle) * 2000;
            this.moonY = canvas.height / 2 + Math.sin(angle) * 2000;

            const distToMoon = Math.sqrt((this.x - this.moonX) ** 2 + (this.y - this.moonY) ** 2);
            if (distToMoon < 100) {
                this.moonVisits++;
                this.credits += this.level * 1000;
                this.level += 1;
                this.x = canvas.width / 2;
                this.y = canvas.height / 2;
                this.vx = 0;
                this.vy = 0;
                this.fuel = this.maxFuel;
                this.moonVisible = false;
            }
        }

        // Fuel management
        this.fuel = Math.max(0, this.fuel);
        if (this.fuel === 0) {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }

        // Passive income
        this.credits += this.level * 0.01 * (this.altitude / 1000 + 1);

        // Update particles
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Particle effects on thrust
        if ((this.keys['w'] || this.keys[' '] || this.keys['shift']) && Math.random() < 0.3) {
            const particleColor = this.keys[' '] ? '#ff0' : (this.keys['shift'] ? '#f00' : '#0ff');
            this.particles.push({
                x: this.x - Math.cos(this.angle) * 15,
                y: this.y - Math.sin(this.angle) * 15,
                vx: (Math.random() - 0.5) * 2 - Math.cos(this.angle) * 1,
                vy: (Math.random() - 0.5) * 2 - Math.sin(this.angle) * 1,
                life: 30,
                color: particleColor
            });
        }

        this.updateUI();
    },

    draw() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!this.ship) {
            ctx.fillStyle = '#0ff';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SELECT YOUR SHIP TO BEGIN', canvas.width / 2, canvas.height / 2);
            return;
        }

        const camX = this.x - canvas.width / 2;
        const camY = this.y - canvas.height / 2;

        // Draw stars
        ctx.fillStyle = '#333';
        for (let star of this.stars) {
            const sx = star.x - camX;
            const sy = star.y - camY;
            ctx.globalAlpha = star.opacity;
            ctx.fillRect(sx, sy, star.size, star.size);
        }
        ctx.globalAlpha = 1;

        // Draw moon
        if (this.moonVisible) {
            const moonScreenX = this.moonX - camX;
            const moonScreenY = this.moonY - camY;
            ctx.fillStyle = '#ccc';
            ctx.beginPath();
            ctx.arc(moonScreenX, moonScreenY, 60, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw particles
        for (let p of this.particles) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.fillRect(p.x - camX, p.y - camY, 3, 3);
        }
        ctx.globalAlpha = 1;

        // Draw ship at center
        const shipScreenX = canvas.width / 2;
        const shipScreenY = canvas.height / 2;

        ctx.save();
        ctx.translate(shipScreenX, shipScreenY);
        ctx.rotate(this.angle);
        
        // Apply roll for cool visual effect only
        ctx.rotate((this.roll * Math.PI) / 180 * 0.5);

        ctx.fillStyle = this.ship.color;
        ctx.beginPath();
        ctx.moveTo(20, 0);
        ctx.lineTo(-10, -10);
        ctx.lineTo(-5, 0);
        ctx.lineTo(-10, 10);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.restore();

        // Draw HUD
        ctx.fillStyle = '#0ff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Fuel: ${Math.floor(this.fuel)}/${Math.floor(this.maxFuel)}`, 10, canvas.height - 10);
    },

    updateUI() {
        document.getElementById('shipName').textContent = this.ship?.name || '-';
        document.getElementById('credits').textContent = Math.floor(this.credits);
        document.getElementById('level').textContent = this.level;
        document.getElementById('fuel').textContent = Math.floor((this.fuel / this.maxFuel) * 100) + '%';
        document.getElementById('altitude').textContent = Math.floor(this.altitude);
        document.getElementById('speed').textContent = Math.floor(Math.sqrt(this.vx ** 2 + this.vy ** 2));
        document.getElementById('moonVisits').textContent = this.moonVisits;

        const fuelCost = Math.floor(100 * Math.pow(1.5, this.upgrades.fuel));
        const speedCost = Math.floor(150 * Math.pow(1.5, this.upgrades.speed));
        const turnCost = Math.floor(120 * Math.pow(1.5, this.upgrades.turnRate));
        document.getElementById('cost-fuel').textContent = fuelCost;
        document.getElementById('cost-speed').textContent = speedCost;
        document.getElementById('cost-turnRate').textContent = turnCost;
    }
};

// Event Listeners
document.addEventListener('keydown', (e) => { 
    const key = e.key.toLowerCase();
    if (key === ' ') e.preventDefault(); // Prevent page scroll
    game.keys[key] = true;
});

document.addEventListener('keyup', (e) => { 
    game.keys[e.key.toLowerCase()] = false; 
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Game Loop
function gameLoop() {
    game.update();
    game.draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
