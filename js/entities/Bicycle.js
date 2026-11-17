// Detailed 3D Procedural Bicycle Entity & Physics Engine
export class Bicycle {
    constructor(THREE, game) {
        this.THREE = THREE;
        this.game = game;
        this.mesh = new THREE.Group();

        // Physics State
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0; // Yaw angle (radians)
        this.steerAngle = 0; // Handlebar turning angle
        this.speed = 0; // m/s
        this.speedKmh = 0;
        this.verticalVelocity = 0;
        this.isGrounded = true;
        this.hopCooldown = 0;
        this.isParked = false;

        // Gearbox: 1 (Climbing) to 5 (High Speed)
        this.currentGear = 2;
        this.gearRatios = [0, 0.55, 0.85, 1.15, 1.55, 2.05];

        // Durability & Stats
        this.condition = 85.0; // 0 to 100%
        this.headlightOn = false;
        this.dynamoCharge = 50.0; // 0 to 100%

        // Upgrades
        this.upgrades = {
            frame: 1, // 1: Standard, 2: Lightweight Alloy, 3: Reinforced Survival
            tires: 1, // 1: Road/Touring, 2: All-Terrain, 3: Knobby Off-Road
            gears: 1, // 1: Standard 5-speed, 2: Wide-Range Climbing Cassette
            brakes: 1, // 1: Rim Caliper, 2: Hydraulic Disc Brakes
            storage: 1, // 1: Rear Rack (16 slots), 2: Twin Panniers (28 slots), 3: Expedition Pack (40 slots)
            dynamo: 1, // 1: Standard, 2: High-Output Brushless Dynamo
            lighting: 1 // 1: Halogen Beam, 2: Ultra-Bright LED Array
        };

        // References to moving 3D sub-components
        this.frontFork = null;
        this.frontWheel = null;
        this.rearWheel = null;
        this.crankLeft = null;
        this.crankRight = null;
        this.pedalLeft = null;
        this.pedalRight = null;
        this.headlightLight = null;
        this.headlightBeam = null;
        this.panniersGroup = null;

        this.buildModel();
    }

    buildModel() {
        const THREE = this.THREE;
        const g = this.mesh;

        // Materials
        const frameColor = 0x3d4e43; // Olive post-apocalyptic frame
        const steelColor = 0x8a928e;
        const rubberColor = 0x1a1c1a;
        const accentColor = 0xc47b3b; // Leather saddle / grips

        const matFrame = new THREE.MeshStandardMaterial({ color: frameColor, roughness: 0.5, metalness: 0.3 });
        const matSteel = new THREE.MeshStandardMaterial({ color: steelColor, roughness: 0.3, metalness: 0.8 });
        const matRubber = new THREE.MeshStandardMaterial({ color: rubberColor, roughness: 0.9 });
        const matLeather = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.7 });

        // Helper cylinder for tubes
        const createTube = (parent, p1, p2, radius, mat) => {
            const v1 = new THREE.Vector3(...p1);
            const v2 = new THREE.Vector3(...p2);
            const dist = v1.distanceTo(v2);
            const geom = new THREE.CylinderGeometry(radius, radius, dist, 8);
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.copy(v1).add(v2).multiplyScalar(0.5);
            mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.sub(v1).normalize());
            mesh.castShadow = true;
            parent.add(mesh);
            return mesh;
        };

        // 1. Rear Triangle & Bottom Bracket (BB at [0, 0.3, 0])
        const bb = [0, 0.3, 0];
        const rearHub = [0, 0.34, -0.56];
        const seatJunction = [0, 0.72, -0.18];
        const headJunctionTop = [0, 0.84, 0.44];
        const headJunctionBot = [0, 0.56, 0.4];

        // Frame tubes
        createTube(g, bb, seatJunction, 0.022, matFrame); // Seat tube
        createTube(g, bb, headJunctionBot, 0.024, matFrame); // Down tube
        createTube(g, seatJunction, headJunctionTop, 0.022, matFrame); // Top tube
        createTube(g, seatJunction, rearHub, 0.016, matFrame); // Seat stays
        createTube(g, bb, rearHub, 0.018, matFrame); // Chain stays
        createTube(g, headJunctionBot, headJunctionTop, 0.028, matSteel); // Head tube

        // 2. Seatpost & Leather Saddle
        createTube(g, seatJunction, [0, 0.82, -0.22], 0.018, matSteel);
        const saddleGeom = new THREE.BoxGeometry(0.14, 0.05, 0.26);
        const saddle = new THREE.Mesh(saddleGeom, matLeather);
        saddle.position.set(0, 0.85, -0.22);
        saddle.rotation.x = -0.05;
        saddle.castShadow = true;
        g.add(saddle);

        // 3. Rear Wheel & Sprocket
        this.rearWheel = new THREE.Group();
        this.rearWheel.position.set(rearHub[0], rearHub[1], rearHub[2]);
        // Tire
        const tireGeom = new THREE.TorusGeometry(0.34, 0.035, 8, 24);
        const rearTire = new THREE.Mesh(tireGeom, matRubber);
        rearTire.rotation.y = Math.PI / 2;
        rearTire.castShadow = true;
        this.rearWheel.add(rearTire);
        // Spokes / Rim
        const rimGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.02, 16, 1, true);
        const rim = new THREE.Mesh(rimGeom, matSteel);
        rim.rotation.z = Math.PI / 2;
        this.rearWheel.add(rim);
        g.add(this.rearWheel);

        // 4. Front Fork & Handlebars (Steerable Group)
        this.frontFork = new THREE.Group();
        this.frontFork.position.set(0, 0.84, 0.44);
        const forkHead = [0, 0, 0];
        const frontHubRel = [0, -0.5, 0.16];

        createTube(this.frontFork, forkHead, frontHubRel, 0.018, matSteel); // Fork blades
        createTube(this.frontFork, forkHead, [0, 0.12, 0], 0.02, matSteel); // Stem
        // Handlebars
        const barGeom = new THREE.BoxGeometry(0.58, 0.025, 0.035);
        const bar = new THREE.Mesh(barGeom, matSteel);
        bar.position.set(0, 0.14, 0.03);
        this.frontFork.add(bar);

        // Front Wheel inside fork
        this.frontWheel = new THREE.Group();
        this.frontWheel.position.set(frontHubRel[0], frontHubRel[1], frontHubRel[2]);
        const frontTire = new THREE.Mesh(tireGeom, matRubber);
        frontTire.rotation.y = Math.PI / 2;
        frontTire.castShadow = true;
        this.frontWheel.add(frontTire);
        this.frontWheel.add(rim.clone());
        this.frontFork.add(this.frontWheel);

        // Front Headlight
        const lightBox = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.08, 12), matSteel);
        lightBox.rotation.x = Math.PI / 2;
        lightBox.position.set(0, 0.06, 0.09);
        this.frontFork.add(lightBox);

        // Headlight beam spotlight
        this.headlightLight = new THREE.SpotLight(0xfffae0, 0, 35, Math.PI / 5, 0.4, 1.5);
        this.headlightLight.position.set(0, 0.06, 0.12);
        this.headlightLight.target.position.set(0, -0.2, 10);
        this.frontFork.add(this.headlightLight);
        this.frontFork.add(this.headlightLight.target);

        g.add(this.frontFork);

        // 5. Cranks & Pedals at BB
        this.crankGroup = new THREE.Group();
        this.crankGroup.position.set(0, 0.3, 0);
        // Chainring
        const chainring = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.01, 16), matSteel);
        chainring.rotation.z = Math.PI / 2;
        chainring.position.x = 0.04;
        this.crankGroup.add(chainring);

        // Left crank
        this.crankLeft = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.015), matSteel);
        this.crankLeft.position.set(-0.06, 0.05, 0);
        this.pedalLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.06), matRubber);
        this.pedalLeft.position.set(-0.04, 0.07, 0);
        this.crankLeft.add(this.pedalLeft);
        this.crankGroup.add(this.crankLeft);

        // Right crank
        this.crankRight = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.14, 0.015), matSteel);
        this.crankRight.position.set(0.06, -0.05, 0);
        this.pedalRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.06), matRubber);
        this.pedalRight.position.set(0.04, -0.07, 0);
        this.crankRight.add(this.pedalRight);
        this.crankGroup.add(this.crankRight);

        g.add(this.crankGroup);

        // 6. Rear Cargo Rack & Panniers
        this.panniersGroup = new THREE.Group();
        const rackBed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 0.42), matSteel);
        rackBed.position.set(0, 0.68, -0.42);
        this.panniersGroup.add(rackBed);

        // Canvas Pannier Bags
        const bagMat = new THREE.MeshStandardMaterial({ color: 0x475143, roughness: 0.8 });
        const leftBag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.32), bagMat);
        leftBag.position.set(-0.16, 0.52, -0.42);
        const rightBag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.32), bagMat);
        rightBag.position.set(0.16, 0.52, -0.42);
        this.panniersGroup.add(leftBag);
        this.panniersGroup.add(rightBag);

        g.add(this.panniersGroup);
    }

    setGear(gearNum) {
        if (gearNum >= 1 && gearNum <= 5) {
            this.currentGear = gearNum;
            return true;
        }
        return false;
    }

    toggleHeadlight() {
        this.headlightOn = !this.headlightOn;
        this.updateHeadlightIntensity();
        return this.headlightOn;
    }

    updateHeadlightIntensity() {
        if (this.headlightOn) {
            const intensity = this.upgrades.lighting === 2 ? 4.5 : 2.8;
            this.headlightLight.intensity = intensity;
        } else {
            this.headlightLight.intensity = 0;
        }
    }

    hop() {
        if (this.isGrounded && this.hopCooldown <= 0 && this.condition > 10) {
            this.verticalVelocity = 4.2;
            this.isGrounded = false;
            this.hopCooldown = 0.6;
            this.condition -= 0.15; // Minor wear on jump
            return true;
        }
        return false;
    }

    repair(amount = 40) {
        this.condition = Math.min(100, this.condition + amount);
    }

    update(dt, input, worldHeightFn, surfaceType, playerStamina) {
        // Cooldowns
        if (this.hopCooldown > 0) this.hopCooldown -= dt;

        // Determine surface friction multiplier
        let surfaceDrag = 1.0;
        let maxSpeedMultiplier = 1.0;
        if (surfaceType === 'Dirt' || surfaceType === 'Gravel') {
            surfaceDrag = 1.25;
            maxSpeedMultiplier = 0.85;
        } else if (surfaceType === 'Mud') {
            surfaceDrag = 2.4;
            maxSpeedMultiplier = 0.55;
        } else if (surfaceType === 'Sand') {
            surfaceDrag = 3.0;
            maxSpeedMultiplier = 0.45;
        } else if (surfaceType === 'Water') {
            surfaceDrag = 4.5;
            maxSpeedMultiplier = 0.3;
        }

        // Tire upgrade bonus
        if (this.upgrades.tires === 2) surfaceDrag *= 0.85;
        if (this.upgrades.tires === 3) surfaceDrag *= 0.7;

        // Durability effect on rolling resistance
        if (this.condition < 30) surfaceDrag *= 1.35;

        // Gear ratio calculations
        const gearRatio = this.gearRatios[this.currentGear];
        const maxGearSpeed = 4.0 + gearRatio * 4.2; // Base m/s max per gear

        // Slope calculation
        const forwardOffset = 1.5;
        const frontY = worldHeightFn(
            this.position.x + Math.sin(this.rotation) * forwardOffset,
            this.position.z + Math.cos(this.rotation) * forwardOffset
        );
        const currentY = worldHeightFn(this.position.x, this.position.z);
        const slopeGrade = (frontY - currentY) / forwardOffset; // positive = uphill

        // Pedal acceleration
        let pedalForce = 0;
        if (input.forward && playerStamina > 5) {
            // Lower gears give higher climbing force against slope
            const climbingTorque = (6 - this.currentGear) * 2.2;
            const sprintMult = input.sprint ? 1.5 : 1.0;
            pedalForce = (12.0 + climbingTorque) * sprintMult;

            // Uphill penalty reduced in Gear 1-2
            if (slopeGrade > 0.05) {
                pedalForce -= slopeGrade * 35.0 / gearRatio;
            }
        } else if (input.backward) {
            // Reverse / back-pedaling
            pedalForce = -4.0;
        }

        // Downhill free-rolling momentum
        if (slopeGrade < -0.02) {
            pedalForce += Math.abs(slopeGrade) * 18.0;
        }

        // Braking
        let brakeForce = 0;
        if (input.brake) {
            const brakePower = this.upgrades.brakes === 2 ? 32.0 : 20.0;
            brakeForce = Math.sign(this.speed) * brakePower;
        }

        // Drag & Rolling Resistance
        const aeroDrag = 0.08 * this.speed * Math.abs(this.speed);
        const rollingResistance = (1.5 * surfaceDrag) * Math.sign(this.speed);

        // Net Acceleration
        const totalForce = pedalForce - brakeForce - aeroDrag - rollingResistance;
        const mass = 80 + (this.upgrades.frame === 3 ? 15 : 0); // rider + bike mass
        const accel = totalForce / (mass * 0.1);

        this.speed += accel * dt;

        // Clamp speed to gear & surface limits
        const effectiveMaxSpeed = maxGearSpeed * maxSpeedMultiplier * (input.sprint ? 1.25 : 1.0);
        this.speed = Math.max(-2.5, Math.min(effectiveMaxSpeed, this.speed));

        // Auto-stop near zero
        if (!input.forward && !input.backward && Math.abs(this.speed) < 0.25) {
            this.speed = 0;
        }

        this.speedKmh = this.speed * 3.6;

        // Steering & Turning
        const steerSpeed = 2.4;
        let targetSteer = 0;
        if (input.left) targetSteer = 0.55;
        if (input.right) targetSteer = -0.55;

        // Steer angle smoothing
        this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1.0, 10 * dt);

        // Turn rate depends on moving speed
        if (Math.abs(this.speed) > 0.1) {
            const turnRate = this.steerAngle * Math.min(1.4, Math.abs(this.speed) * 0.35);
            this.rotation += turnRate * dt * steerSpeed * Math.sign(this.speed);
        }

        // Move position
        const moveX = Math.sin(this.rotation) * this.speed * dt;
        const moveZ = Math.cos(this.rotation) * this.speed * dt;
        this.position.x += moveX;
        this.position.z += moveZ;

        // Vertical Physics (Gravity & Hopping)
        const groundHeight = worldHeightFn(this.position.x, this.position.z);
        if (!this.isGrounded) {
            this.verticalVelocity -= 14.0 * dt; // Gravity
            this.position.y += this.verticalVelocity * dt;
            if (this.position.y <= groundHeight) {
                this.position.y = groundHeight;
                this.verticalVelocity = 0;
                this.isGrounded = true;
            }
        } else {
            this.position.y = groundHeight;
        }

        // Apply to 3D mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;

        // Lean slightly into turns
        const leanAngle = -this.steerAngle * (Math.abs(this.speed) / 10.0) * 0.4;
        this.mesh.rotation.z = leanAngle;

        // Steer fork
        if (this.frontFork) {
            this.frontFork.rotation.y = this.steerAngle;
        }

        // Rotate wheels & pedals
        const wheelRotSpeed = (this.speed / 0.34) * dt;
        if (this.rearWheel) this.rearWheel.rotation.x += wheelRotSpeed;
        if (this.frontWheel) this.frontWheel.rotation.x += wheelRotSpeed;
        if (this.crankGroup && Math.abs(this.speed) > 0.2) {
            this.crankGroup.rotation.x += (this.speed / (0.34 * gearRatio)) * dt;
        }

        // Dynamo Charging
        if (Math.abs(this.speedKmh) > 10.0) {
            const chargeRate = this.upgrades.dynamo === 2 ? 1.5 : 0.8;
            this.dynamoCharge = Math.min(100, this.dynamoCharge + chargeRate * dt);
        }

        // Durability wear over distance & rough terrain
        const wearRate = (0.015 * surfaceDrag) * (Math.abs(this.speed) / 10.0);
        this.condition = Math.max(0, this.condition - wearRate * dt);
    }
}
