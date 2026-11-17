// Procedural Open-World Post-Apocalyptic Environment Generator
export class WorldGenerator {
    constructor(THREE, game) {
        this.THREE = THREE;
        this.game = game;
        this.group = new THREE.Group();

        this.colliders = [];
        this.pois = [];
        this.caches = [];
        this.buildings = [];
        this.roads = [];
        this.cfg = null;
        this.groundMesh = null;
    }

    generate(countryConfig) {
        this.cfg = countryConfig;

        // Clear existing
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        this.colliders = [];
        this.pois = [];
        this.caches = [];
        this.buildings = [];
        this.roads = [];

        // 1. Setup Road Layouts
        this.roads = [
            { x: 0, z: 0, w: 12, l: 580, axis: 'z' }, // Main North-South Highway
            { x: 0, z: 0, w: 10, l: 580, axis: 'x' }  // Main East-West Crossroad
        ];

        if (countryConfig.id === 'usa') {
            this.roads.push({ x: -130, z: 0, w: 18, l: 580, axis: 'z' }); // Wide Interstate 101
        } else if (countryConfig.id === 'portugal') {
            this.roads.push({ x: 40, z: 0, w: 6, l: 400, axis: 'z', isTram: true }); // Tram 28 Track
        } else if (countryConfig.id === 'india') {
            this.roads.push({ x: 0, z: -110, w: 8, l: 480, axis: 'x' }); // Tech corridor bypass
        } else if (countryConfig.id === 'spain') {
            this.roads.push({ x: -100, z: 0, w: 9, l: 500, axis: 'z' }); // Canyon highway
        }

        // 2. Build Terrain Mesh with Vertex Colors
        this.buildTerrain();

        // 3. Build Road Meshes
        this.roads.forEach(r => this.buildRoadMesh(r));

        // 4. Build Survivor Camp at Origin (0,0)
        this.buildSurvivorCamp();

        // 5. Build Country Specific POIs & Landmarks
        this.buildLandmarks();

        // 6. Build City Ruins & Roadside Architecture
        this.buildRuinedSettlements();

        // 7. Scatter Abandoned Vehicles & Debris
        this.scatterVehicles();

        // 8. Scatter Foliage & Trees
        this.scatterTrees();

        // 9. Scatter Supply Caches & Scrap Points
        this.scatterLootCaches();

        return this.group;
    }

    waterAt(x, z) {
        if (this.cfg.id === 'portugal') return x < -195; // Atlantic Ocean
        if (this.cfg.id === 'india') return x > 190 && x < 225 && Math.abs(z) > 10; // Flooded Lake/Monsoon Canal
        if (this.cfg.id === 'spain') return Math.abs(x - 140) < 18 && z > 50; // Deep Aquifer Well
        return false;
    }

    getHeight(x, z) {
        if (this.waterAt(x, z)) return -1.5;

        // Base undulating hills
        const outsideDist = Math.max(0, (Math.hypot(x, z) - 80) / 180);
        let h = outsideDist * (6.0 + Math.sin(x * 0.025) * 4.5 + Math.cos(z * 0.028) * 4.0);

        if (this.cfg.id === 'portugal') {
            // Coastal terraced hill descending towards west ocean
            h += (x + 100) * 0.04 + Math.sin(z * 0.03) * 3.5;
        } else if (this.cfg.id === 'spain') {
            // Sierra canyon & mountain peaks
            h += outsideDist * 10.0 + Math.sin(x * 0.04) * 2.5;
        } else if (this.cfg.id === 'usa') {
            // Cascade rolling foothills
            h += Math.sin(x * 0.015) * 6.0 + Math.cos(z * 0.018) * 6.0;
        }

        return Math.max(0, h);
    }

    roadAt(x, z) {
        return this.roads.some(r => {
            if (r.axis === 'z') {
                return Math.abs(x - r.x) < r.w / 2 && Math.abs(z - r.z) < r.l / 2;
            } else {
                return Math.abs(z - r.z) < r.w / 2 && Math.abs(x - r.x) < r.l / 2;
            }
        });
    }

    getSurface(x, z, weatherName = '') {
        if (this.waterAt(x, z)) return 'Water';
        if (this.roadAt(x, z)) return 'Asphalt';
        if (this.cfg.id === 'spain') return 'Sand';
        if (weatherName.includes('Rain') || weatherName.includes('Monsoon')) return 'Mud';
        return 'Dirt';
    }

    addCollider(x, z, w, d) {
        this.colliders.push({ x, z, hw: w / 2, hd: d / 2 });
    }

    isBlocked(x, z, radius = 0.5) {
        return this.colliders.some(c =>
            Math.abs(x - c.x) < c.hw + radius && Math.abs(z - c.z) < c.hd + radius
        );
    }

    buildTerrain() {
        const THREE = this.THREE;
        const size = 600;
        const segments = 120;
        const geom = new THREE.PlaneGeometry(size, size, segments, segments);
        geom.rotateX(-Math.PI / 2);

        const pos = geom.attributes.position;
        const colors = [];
        const baseGround = new THREE.Color(this.cfg.groundColor);

        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const z = pos.getZ(i);
            const y = this.getHeight(x, z);
            pos.setY(i, y);

            // Subtle color variation
            const noise = (Math.sin(x * 0.1) + Math.cos(z * 0.1)) * 0.08;
            const c = baseGround.clone().offsetHSL(noise, 0, noise * 0.5);
            colors.push(c.r, c.g, c.b);
        }

        geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geom.computeVertexNormals();

        const mat = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.95,
            metalness: 0.05
        });

        this.groundMesh = new THREE.Mesh(geom, mat);
        this.groundMesh.receiveShadow = true;
        this.group.add(this.groundMesh);

        // Water Plane if applicable
        if (this.cfg.id === 'portugal') {
            const waterGeom = new THREE.PlaneGeometry(160, 600);
            waterGeom.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x2e4a4a,
                roughness: 0.1,
                metalness: 0.6,
                transparent: true,
                opacity: 0.85
            });
            const ocean = new THREE.Mesh(waterGeom, waterMat);
            ocean.position.set(-270, 0.4, 0);
            this.group.add(ocean);
        } else if (this.cfg.id === 'india') {
            const canalGeom = new THREE.PlaneGeometry(35, 600);
            canalGeom.rotateX(-Math.PI / 2);
            const waterMat = new THREE.MeshStandardMaterial({
                color: 0x3d5045,
                roughness: 0.2,
                transparent: true,
                opacity: 0.9
            });
            const canal = new THREE.Mesh(canalGeom, waterMat);
            canal.position.set(207.5, 0.2, 0);
            this.group.add(canal);
        }
    }

    buildRoadMesh(road) {
        const THREE = this.THREE;
        const segments = 100;
        const verts = [];
        const inds = [];

        for (let i = 0; i <= segments; i++) {
            const t = -road.l / 2 + (i * road.l) / segments;
            for (const sign of [-1, 1]) {
                const rx = road.x + (road.axis === 'z' ? (sign * road.w) / 2 : t);
                const rz = road.z + (road.axis === 'z' ? t : (sign * road.w) / 2);
                const ry = this.getHeight(rx, rz) + 0.06;
                verts.push(rx, ry, rz);
            }
            if (i < segments) {
                const a = i * 2;
                inds.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
            }
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
        geo.setIndex(inds);
        geo.computeVertexNormals();

        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x383e3b,
            roughness: 0.85,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geo, roadMat);
        mesh.receiveShadow = true;
        this.group.add(mesh);

        // Center dashed yellow/white lane stripes
        for (let t = -road.l / 2 + 6; t < road.l / 2 - 6; t += 14) {
            const sx = road.x + (road.axis === 'x' ? t : 0);
            const sz = road.z + (road.axis === 'z' ? t : 0);
            const sy = this.getHeight(sx, sz) + 0.08;

            const stripeGeom = new THREE.BoxGeometry(
                road.axis === 'z' ? 0.2 : 4.5,
                0.02,
                road.axis === 'z' ? 4.5 : 0.2
            );
            const stripeMat = new THREE.MeshStandardMaterial({ color: 0xad9e67, roughness: 0.8 });
            const stripe = new THREE.Mesh(stripeGeom, stripeMat);
            stripe.position.set(sx, sy, sz);
            this.group.add(stripe);
        }
    }

    buildSurvivorCamp() {
        const THREE = this.THREE;
        const g = new THREE.Group();
        const y = this.getHeight(0, 0);
        g.position.set(0, y, 0);

        // 1. Campfire with glowing coals and pointlight
        const fireBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.8, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x221f1d })
        );
        fireBase.position.set(0, 0.1, 0);
        g.add(fireBase);

        const flameLight = new THREE.PointLight(0xff7722, 2.5, 18, 1.2);
        flameLight.position.set(0, 0.6, 0);
        g.add(flameLight);

        // 2. Bicycle Repair Workbench & Tools
        const benchGeom = new THREE.BoxGeometry(1.8, 0.85, 0.8);
        const benchMat = new THREE.MeshStandardMaterial({ color: 0x5a4836, roughness: 0.8 });
        const bench = new THREE.Mesh(benchGeom, benchMat);
        bench.position.set(3.5, 0.42, 1.5);
        bench.castShadow = true;
        g.add(bench);
        this.addCollider(3.5, 1.5, 1.8, 0.8);

        // Bike Stand next to bench
        const standGeom = new THREE.BoxGeometry(0.08, 1.1, 0.6);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x737d77, metalness: 0.7 });
        const stand = new THREE.Mesh(standGeom, standMat);
        stand.position.set(2.4, 0.55, 1.5);
        g.add(stand);

        // 3. Resting Cot / Tent
        const tentGeom = new THREE.ConeGeometry(2.2, 2.4, 4);
        tentGeom.rotateY(Math.PI / 4);
        const tentMat = new THREE.MeshStandardMaterial({ color: 0x3d4a3c, roughness: 0.9 });
        const tent = new THREE.Mesh(tentGeom, tentMat);
        tent.position.set(-3.8, 1.2, -2.5);
        tent.castShadow = true;
        g.add(tent);
        this.addCollider(-3.8, -2.5, 3.2, 3.2);

        // 4. Water Filtration Barrel
        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.45, 1.1, 12),
            new THREE.MeshStandardMaterial({ color: 0x243e42, metalness: 0.3 })
        );
        barrel.position.set(-2.5, 0.55, 2.8);
        barrel.castShadow = true;
        g.add(barrel);
        this.addCollider(-2.5, 2.8, 0.9, 0.9);

        // 5. NPC Survivor Model (Asha / Eli / Inês / Lucía)
        const npcGroup = new THREE.Group();
        npcGroup.position.set(1.6, 0, -1.8);
        const npcBody = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.9, 0.22),
            new THREE.MeshStandardMaterial({ color: 0xb57848 })
        );
        npcBody.position.y = 0.85;
        npcGroup.add(npcBody);
        const npcHead = new THREE.Mesh(
            new THREE.BoxGeometry(0.18, 0.2, 0.18),
            new THREE.MeshStandardMaterial({ color: 0xba9274 })
        );
        npcHead.position.y = 1.45;
        npcGroup.add(npcHead);
        g.add(npcGroup);

        this.group.add(g);

        // Register POI
        this.pois.push({
            id: 'camp_safehouse',
            name: this.cfg.npc.community,
            x: 0,
            z: 0,
            type: 'camp',
            npcId: this.cfg.npc.id,
            isCamp: true
        });
    }

    buildLandmarks() {
        const THREE = this.THREE;
        const landmarks = this.cfg.landmarks || [];

        landmarks.forEach(lm => {
            const y = this.getHeight(lm.x, lm.z);
            const g = new THREE.Group();
            g.position.set(lm.x, y, lm.z);

            if (lm.type === 'station') {
                // Railway Station & Stalled Freight Train
                this.buildRailwayStation(g, lm.x, lm.z);
            } else if (lm.type === 'tower') {
                // Radio / Antenna Relay Mast
                this.buildRadioTower(g, lm.x, lm.z);
            } else if (lm.type === 'water') {
                // Temple / Deep Well
                this.buildWaterWell(g, lm.x, lm.z);
            } else {
                // Abandoned Hospital / Police / Diner Ruins
                this.buildRuinedFacility(g, lm.x, lm.z, lm.name);
            }

            this.group.add(g);
            this.pois.push(lm);
        });
    }

    buildRailwayStation(parent, x, z) {
        const THREE = this.THREE;
        // Platform
        const platform = new THREE.Mesh(
            new THREE.BoxGeometry(14, 0.8, 38),
            new THREE.MeshStandardMaterial({ color: 0x6e7065, roughness: 0.9 })
        );
        platform.position.y = 0.4;
        platform.castShadow = true;
        parent.add(platform);
        this.addCollider(x, z, 14, 38);

        // Station Canopy Roof
        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(12, 0.3, 24),
            new THREE.MeshStandardMaterial({ color: 0x474943 })
        );
        canopy.position.set(0, 4.2, 0);
        parent.add(canopy);

        // Columns
        for (let cz = -8; cz <= 8; cz += 8) {
            for (let cx of [-4, 4]) {
                const col = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.18, 0.18, 4.2, 8),
                    new THREE.MeshStandardMaterial({ color: 0x333b37, metalness: 0.7 })
                );
                col.position.set(cx, 2.1, cz);
                parent.add(col);
            }
        }

        // Stalled Locomotive / Railcars
        const train = new THREE.Mesh(
            new THREE.BoxGeometry(3.2, 3.4, 16),
            new THREE.MeshStandardMaterial({ color: 0x8a4538, roughness: 0.7, metalness: 0.4 })
        );
        train.position.set(9.5, 2.1, 0);
        train.castShadow = true;
        parent.add(train);
        this.addCollider(x + 9.5, z, 3.5, 16);

        // Quest item inside train cab
        this.caches.push({
            id: 'radio_unit_cache',
            x: x + 9.5,
            z: z + 6,
            name: 'Locomotive Receiver Cab',
            loot: { radio_unit: 1, scrap: 4, tool: 1, food: 2 }
        });
    }

    buildRadioTower(parent, x, z) {
        const THREE = this.THREE;
        const height = 28;
        // Lattice Truss Tower
        const legGeom = new THREE.CylinderGeometry(0.12, 0.22, height, 6);
        const matTower = new THREE.MeshStandardMaterial({ color: 0xa84e44, metalness: 0.8 });

        for (let signX of [-1, 1]) {
            for (let signZ of [-1, 1]) {
                const leg = new THREE.Mesh(legGeom, matTower);
                leg.position.set(signX * 1.8, height / 2, signZ * 1.8);
                parent.add(leg);
            }
        }

        // Antenna Dishes
        const dish = new THREE.Mesh(
            new THREE.SphereGeometry(1.6, 12, 12, 0, Math.PI * 2, 0, Math.PI / 3),
            new THREE.MeshStandardMaterial({ color: 0xdde3d5, side: THREE.DoubleSide })
        );
        dish.position.set(0, height - 2, 0);
        dish.rotation.x = Math.PI / 4;
        parent.add(dish);

        // Flashing Warning Red Beacon Light at top
        const beaconLight = new THREE.PointLight(0xff2222, 2.0, 30);
        beaconLight.position.set(0, height, 0);
        parent.add(beaconLight);

        // Bunker Base
        const bunker = new THREE.Mesh(
            new THREE.BoxGeometry(6, 3.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x565851, roughness: 0.9 })
        );
        bunker.position.set(0, 1.6, 0);
        parent.add(bunker);
        this.addCollider(x, z, 6, 6);

        // Cache inside bunker
        this.caches.push({
            id: 'tower_bunker_cache',
            x: x + 2,
            z: z + 2,
            name: 'Relay Bunker Supply Safe',
            loot: { battery: 2, scrap: 6, medkit: 1, relay_battery: 1, clock_recorder: 1, harbor_log: 1 }
        });
    }

    buildWaterWell(parent, x, z) {
        const THREE = this.THREE;
        const well = new THREE.Mesh(
            new THREE.CylinderGeometry(2.4, 2.6, 1.2, 12),
            new THREE.MeshStandardMaterial({ color: 0x737063, roughness: 0.9 })
        );
        well.position.y = 0.6;
        parent.add(well);
        this.addCollider(x, z, 5.2, 5.2);

        // Clean water cache
        this.caches.push({
            id: 'well_cache',
            x: x,
            z: z,
            name: 'Ancient Stone Aquifer',
            loot: { water: 3, fruit: 2 }
        });
    }

    buildRuinedFacility(parent, x, z, title) {
        const THREE = this.THREE;
        const w = 16, d = 20, h = 5.5;
        const wallMat = new THREE.MeshStandardMaterial({ color: this.cfg.wallColors[0], roughness: 0.85 });

        // Outer Walls with open Doorway
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), wallMat);
        leftWall.position.set(0, h / 2, -d / 2);
        parent.add(leftWall);

        const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, d), wallMat);
        sideL.position.set(-w / 2, h / 2, 0);
        parent.add(sideL);

        const sideR = new THREE.Mesh(new THREE.BoxGeometry(0.4, h, d), wallMat);
        sideR.position.set(w / 2, h / 2, 0);
        parent.add(sideR);

        // Front wall with doorway
        const frontL = new THREE.Mesh(new THREE.BoxGeometry(6, h, 0.4), wallMat);
        frontL.position.set(-5, h / 2, d / 2);
        parent.add(frontL);

        const frontR = new THREE.Mesh(new THREE.BoxGeometry(6, h, 0.4), wallMat);
        frontR.position.set(5, h / 2, d / 2);
        parent.add(frontR);

        this.addCollider(x - 5, z + d / 2, 6, 0.6);
        this.addCollider(x + 5, z + d / 2, 6, 0.6);
        this.addCollider(x, z - d / 2, w, 0.6);
        this.addCollider(x - w / 2, z, 0.6, d);
        this.addCollider(x + w / 2, z, 0.6, d);

        // Interior Floor
        const floor = new THREE.Mesh(
            new THREE.BoxGeometry(w - 0.8, 0.15, d - 0.8),
            new THREE.MeshStandardMaterial({ color: 0x3d403c })
        );
        floor.position.y = 0.08;
        parent.add(floor);

        // Interior Desks with loot
        this.caches.push({
            id: `facility_loot_${x}_${z}`,
            x: x - 3,
            z: z - 4,
            name: `${title} - Filing Vault`,
            loot: { food: 3, medkit: 1, scrap: 5, battery: 1 }
        });
    }

    buildRuinedSettlements() {
        const THREE = this.THREE;
        const coords = [
            [-70, -60], [-95, -130], [-130, -50],
            [65, -75], [90, -140], [125, -60],
            [-80, 85], [-130, 110], [75, 95], [115, 140]
        ];

        coords.forEach(([cx, cz], i) => {
            const w = 9 + (i % 3) * 3;
            const d = 11 + (i % 2) * 4;
            const h = 4.2 + (i % 4) * 1.8;
            const color = this.cfg.wallColors[i % this.cfg.wallColors.length];

            const y = this.getHeight(cx, cz);
            const bldg = new THREE.Group();
            bldg.position.set(cx, y, cz);

            const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.9 });
            const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            box.position.y = h / 2;
            box.castShadow = true;
            bldg.add(box);

            // Roof
            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(w + 0.8, 0.3, d + 0.8),
                new THREE.MeshStandardMaterial({ color: this.cfg.roofColor })
            );
            roof.position.y = h + 0.15;
            bldg.add(roof);

            this.group.add(bldg);
            this.addCollider(cx, cz, w, d);
        });
    }

    scatterVehicles() {
        const THREE = this.THREE;
        const vehicleSpots = [
            [-8, -45], [6, -85], [-7, 65], [8, 120],
            [-95, 8], [75, -6], [-140, 8], [130, -6]
        ];

        vehicleSpots.forEach(([vx, vz], idx) => {
            const y = this.getHeight(vx, vz);
            const vg = new THREE.Group();
            vg.position.set(vx, y, vz);
            vg.rotation.y = (idx * 0.7) - 0.3;

            if (this.cfg.id === 'india' && idx % 2 === 0) {
                // Auto-Rickshaw
                const rickMat = new THREE.MeshStandardMaterial({ color: 0x8a9438 }); // Olive/Yellow
                const rickBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 2.4), rickMat);
                rickBody.position.y = 0.85;
                vg.add(rickBody);
                const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.8), new THREE.MeshStandardMaterial({ color: 0xc4b46c }));
                canopy.position.set(0, 1.6, 0.15);
                vg.add(canopy);
                this.addCollider(vx, vz, 1.8, 2.6);
            } else if (this.cfg.id === 'portugal' && idx === 0) {
                // Vintage Tram 28 Car
                const tramMat = new THREE.MeshStandardMaterial({ color: 0xc49b39, roughness: 0.6 }); // Yellow Tram
                const tramBody = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 8.5), tramMat);
                tramBody.position.y = 1.6;
                vg.add(tramBody);
                this.addCollider(vx, vz, 2.6, 9.0);
            } else {
                // Abandoned Sedan / Pickup Truck
                const carMat = new THREE.MeshStandardMaterial({ color: 0x58635d, roughness: 0.7 });
                const carBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 3.9), carMat);
                carBody.position.y = 0.7;
                vg.add(carBody);
                const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 2.0), new THREE.MeshStandardMaterial({ color: 0x313835 }));
                cabin.position.set(0, 1.35, -0.2);
                vg.add(cabin);
                this.addCollider(vx, vz, 2.1, 4.1);
            }

            this.group.add(vg);
        });
    }

    scatterTrees() {
        const THREE = this.THREE;
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2d, roughness: 0.9 });
        const foliageMat = new THREE.MeshStandardMaterial({ color: this.cfg.foliageColor, roughness: 0.8 });

        const count = 75;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = 35 + Math.random() * 230;
            const tx = Math.cos(angle) * dist;
            const tz = Math.sin(angle) * dist;

            // Don't spawn trees directly inside roads or camp
            if (this.roadAt(tx, tz) || Math.hypot(tx, tz) < 20) continue;

            const ty = this.getHeight(tx, tz);
            const tg = new THREE.Group();
            tg.position.set(tx, ty, tz);

            // Trunk
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 4.0, 7), trunkMat);
            trunk.position.y = 2.0;
            trunk.castShadow = true;
            tg.add(trunk);

            // Foliage
            if (this.cfg.id === 'usa') {
                // Tall Pine Tree Cones
                for (let ci = 0; ci < 3; ci++) {
                    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4 - ci * 0.45, 3.2, 7), foliageMat);
                    cone.position.y = 3.8 + ci * 1.3;
                    cone.castShadow = true;
                    tg.add(cone);
                }
            } else {
                // Round Banyan / Oak Foliage Canopy
                const canopy = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 1), foliageMat);
                canopy.position.y = 4.8;
                canopy.castShadow = true;
                tg.add(canopy);
            }

            this.group.add(tg);
            this.addCollider(tx, tz, 0.8, 0.8);
        }
    }

    scatterLootCaches() {
        const THREE = this.THREE;
        const cachePoints = [
            { x: -45, z: -25, name: 'Abandoned Service Station Crate', loot: { kit: 1, scrap: 3, fruit: 2 } },
            { x: 35, z: -85, name: 'Roadside Emergency Cache', loot: { bandage: 2, water: 1, scrap: 2 } },
            { x: -110, z: 45, name: 'Wrecked Courier Van Cargo', loot: { food: 2, tool: 1, battery: 2 } },
            { x: 85, z: 65, name: 'Surveyor Field Kit', loot: { water: 2, rope: 2, scrap: 4 } }
        ];

        cachePoints.forEach(cp => {
            const y = this.getHeight(cp.x, cp.z);
            const crateGeom = new THREE.BoxGeometry(0.9, 0.7, 0.8);
            const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a7a58, roughness: 0.8 });
            const crate = new THREE.Mesh(crateGeom, crateMat);
            crate.position.set(cp.x, y + 0.35, cp.z);
            crate.castShadow = true;
            this.group.add(crate);

            this.caches.push({
                id: `cache_${cp.x}_${cp.z}`,
                x: cp.x,
                z: cp.z,
                name: cp.name,
                loot: cp.loot
            });
        });
    }
}
