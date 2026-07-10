// Three.js Scene Setup
let scene, camera, renderer;
let shipMesh, moonMesh;
let particles = [];
let starField;

function initThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    scene.fog = new THREE.Fog(0x000011, 5000, 15000);

    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        50000
    );
    camera.position.set(0, 50, 80);
    camera.lookAt(0, 0, 0);

    // Renderer
    const canvas = document.getElementById('canvas');
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(500, 500, 500);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create Starfield
    createStarfield();

    // Create Earth
    createEarth();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(200, 64, 64);
    const earthMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a5f7a,
        emissive: 0x111111,
        shininess: 5
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.y = -300;
    earth.castShadow = true;
    earth.receiveShadow = true;
    scene.add(earth);

    // Add some continents (simple green spots)
    const continentGeometry = new THREE.SphereGeometry(200, 64, 64);
    const continentMaterial = new THREE.MeshPhongMaterial({
        color: 0x2d5a2d,
        emissive: 0x0a0a0a
    });
    const continents = new THREE.Mesh(continentGeometry, continentMaterial);
    continents.position.y = -300;
    continents.scale.set(0.99, 0.99, 0.99);
    scene.add(continents);
}

function createStarfield() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
        const i3 = i * 3;
        positions[i3] = (Math.random() - 0.5) * 40000;
        positions[i3 + 1] = (Math.random() - 0.5) * 40000;
        positions[i3 + 2] = (Math.random() - 0.5) * 40000;

        // Vary star colors
        const brightness = Math.random();
        colors[i3] = brightness;
        colors[i3 + 1] = brightness;
        colors[i3 + 2] = brightness;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
        size: 20,
        sizeAttenuation: true,
        vertexColors: true
    });

    starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
}

function createShip(color) {
    if (shipMesh) scene.remove(shipMesh);

    const group = new THREE.Group();

    // Main body (cone shape)
    const coneGeometry = new THREE.ConeGeometry(8, 30, 8);
    const shipMaterial = new THREE.MeshPhongMaterial({ 
        color: color, 
        emissive: color, 
        emissiveIntensity: 0.3,
        wireframe: false
    });
    const cone = new THREE.Mesh(coneGeometry, shipMaterial);
    cone.rotation.z = Math.PI / 2;
    cone.castShadow = true;
    group.add(cone);

    // Thrusters (small cubes on sides)
    const thrusterGeometry = new THREE.BoxGeometry(3, 3, 8);
    const thrusterMaterial = new THREE.MeshPhongMaterial({ color: 0xff6600, emissive: 0xff3300 });

    const thruster1 = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    thruster1.position.set(10, 5, 0);
    thruster1.castShadow = true;
    group.add(thruster1);

    const thruster2 = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
    thruster2.position.set(10, -5, 0);
    thruster2.castShadow = true;
    group.add(thruster2);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(15, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Position ship above earth
    group.position.y = 100;

    scene.add(group);
    shipMesh = group;
    console.log('Ship created at:', group.position);
    return group;
}

function createMoon() {
    if (moonMesh) scene.remove(moonMesh);

    const moonGeometry = new THREE.SphereGeometry(80, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        emissive: 0x333333,
        shininess: 5
    });

    moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
    moonMesh.castShadow = true;
    moonMesh.receiveShadow = true;
    scene.add(moonMesh);

    console.log('Moon created');
    return moonMesh;
}

function createParticle(position, color, velocity) {
    const particleGeometry = new THREE.SphereGeometry(2, 8, 8);
    const particleMaterial = new THREE.MeshBasicMaterial({ color: color });
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);

    particle.position.copy(position);
    particle.velocity = velocity;
    particle.life = 30;
    particle.maxLife = 30;

    scene.add(particle);
    particles.push(particle);

    return particle;
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.position.add(p.velocity);
        p.life--;

        p.material.opacity = p.life / p.maxLife;

        if (p.life <= 0) {
            scene.remove(p);
            particles.splice(i, 1);
        }
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Game Logic
const SHIPS = {
    nebulaStar: { name: 'Nebula StarShip', speed: 2, acceleration: 0.3, turnRate: 2, fuel: 1000, fuelConsume: 0.2, color: 0x00ff00 },
    nebulaPro: { name: 'Nebula ProShip', speed: 3, acceleration: 0.4, turnRate: 2.5, fuel: 800, fuelConsume: 0.25, color: 0x00ffff },
    quantamStar: { name: 'QuantamStarship', speed: 5, acceleration: 0.6, turnRate: 3, fuel: 600, fuelConsume: 0.3, color: 0xff00ff },
    quantamPro: { name: 'QuantamProShip', speed: 7, acceleration: 0.8, turnRate: 3.5, fuel: 400, fuelConsume: 0.4, color: 0xffff00 }
};

const gameInstance = {
    ship: null,
    position: new THREE.Vector3(0, 100, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    roll: 0,
    fuel: 1000,
    maxFuel: 1000,
    credits: 0,
    level: 1,
    altitude: 0,
    moonVisits: 0,
    keys: {},
    upgrades: { fuel: 0, speed: 0, turnRate: 0 },
    moonVisible: false,
    moonPosition: new THREE.Vector3(0, 0, 0),

    selectShip(shipKey) {
        this.ship = { ...SHIPS[shipKey], key: shipKey };
        this.fuel = this.ship.fuel;
        this.maxFuel = this.ship.fuel;
        this.position.set(0, 100, 0);
        this.velocity.set(0, 0, 0);
        this.rotation.set(0, 0, 0);
        this.roll = 0;
        this.altitude = 100;
        this.credits = 0;
        this.level = 1;
        this.moonVisits = 0;
        this.upgrades = { fuel: 0, speed: 0, turnRate: 0 };

        // Clear old particles
        particles.forEach(p => scene.remove(p));
        particles = [];

        // Create 3D ship
        const colorHex = this.ship.color;
        createShip(colorHex);

        console.log('Ship selected:', shipKey);
        document.getElementById('shipSelect').style.display = 'none';
        this.updateUI();
    },

    changeShip() {
        document.getElementById('shipSelect').style.display = 'block';
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

        // Forward/Backward movement
        if (this.keys['w']) {
            const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
            this.velocity.addScaledVector(forward, this.ship.acceleration * speedMult);
        }
        if (this.keys['s']) {
            const forward = new THREE.Vector3(0, 0, 1).applyEuler(this.rotation);
            this.velocity.addScaledVector(forward, -this.ship.acceleration * speedMult * 0.5);
        }

        // Rotation (Pitch & Yaw)
        if (this.keys['a']) this.rotation.y += (this.ship.turnRate * turnMult) * Math.PI / 180;
        if (this.keys['d']) this.rotation.y -= (this.ship.turnRate * turnMult) * Math.PI / 180;

        // Roll (visual only)
        if (this.keys['q']) this.roll -= 8;
        if (this.keys['e']) this.roll += 8;

        // Boost
        if (this.keys[' ']) {
            this.velocity.multiplyScalar(1.05);
            this.fuel -= 2;
        }

        // Suction (upward pull to go up faster)
        if (this.keys['shift']) {
            this.velocity.y += 0.8;
            this.fuel -= 1.5;
        }

        // Apply friction
        this.velocity.multiplyScalar(0.98);
        this.roll *= 0.92;

        // Fuel consumption
        if (this.keys['w'] || this.keys['s']) {
            this.fuel -= this.ship.fuelConsume + (this.upgrades.fuel * 0.01);
        }

        // Update position
        this.position.add(this.velocity);

        // Calculate altitude (distance from earth center)
        this.altitude = this.position.length();
        if (this.altitude > 1000) this.moonVisible = true;

        // Moon collision
        if (this.moonVisible) {
            const direction = this.position.clone().normalize();
            this.moonPosition.copy(direction).multiplyScalar(2000);

            if (!moonMesh) createMoon();
            moonMesh.position.copy(this.moonPosition);

            const distToMoon = this.position.distanceTo(this.moonPosition);
            if (distToMoon < 100) {
                this.moonVisits++;
                this.credits += this.level * 1000;
                this.level += 1;
                this.position.set(0, 100, 0);
                this.velocity.set(0, 0, 0);
                this.fuel = this.maxFuel;
                this.moonVisible = false;
                if (moonMesh) scene.remove(moonMesh);
            }
        }

        // Fuel management
        this.fuel = Math.max(0, this.fuel);
        if (this.fuel === 0) {
            this.velocity.multiplyScalar(0.95);
        }

        // Passive income
        this.credits += this.level * 0.01 * (this.altitude / 500 + 1);

        // Update ship mesh
        if (shipMesh) {
            shipMesh.position.copy(this.position);
            shipMesh.rotation.copy(this.rotation);
            shipMesh.rotation.z = this.roll * Math.PI / 180;
        }

        // Create particles
        if ((this.keys['w'] || this.keys[' '] || this.keys['shift']) && Math.random() < 0.3) {
            const particleColor = this.keys[' '] ? 0xffff00 : (this.keys['shift'] ? 0xff0000 : 0x00ffff);
            const backward = new THREE.Vector3(0, 0, -1).applyEuler(this.rotation);
            const particlePos = this.position.clone().addScaledVector(backward, 20);
            const particleVel = this.velocity.clone().multiplyScalar(0.5);
            particleVel.addScaledVector(backward, -2);
            createParticle(particlePos, particleColor, particleVel);
        }

        updateParticles();
        this.updateUI();
    },

    updateUI() {
        document.getElementById('shipName').textContent = this.ship?.name || '-';
        document.getElementById('credits').textContent = Math.floor(this.credits);
        document.getElementById('level').textContent = this.level;
        document.getElementById('fuel').textContent = Math.floor((this.fuel / this.maxFuel) * 100) + '%';
        document.getElementById('altitude').textContent = Math.floor(this.altitude);
        document.getElementById('speed').textContent = Math.floor(this.velocity.length());
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
    if (key === ' ') e.preventDefault();
    gameInstance.keys[key] = true;
});

document.addEventListener('keyup', (e) => {
    gameInstance.keys[e.key.toLowerCase()] = false;
});

// Initialize and start game loop
initThreeJS();

function gameLoop() {
    gameInstance.update();

    // Update camera to follow ship
    if (shipMesh) {
        const cameraDistance = 100;
        const cameraHeight = 50;
        const cameraOffset = new THREE.Vector3(0, cameraHeight, cameraDistance);
        cameraOffset.applyEuler(gameInstance.rotation);
        
        const targetCameraPos = gameInstance.position.clone().add(cameraOffset);
        camera.position.lerp(targetCameraPos, 0.1);
        camera.lookAt(gameInstance.position);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

console.log('Game initialized, waiting for ship selection...');
gameLoop();
