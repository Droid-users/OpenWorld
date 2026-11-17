// Procedural 3D Wildlife AI & State Machine (Deer, Boar, Wolf, Birds)
export class WildlifeManager {
    constructor(THREE, game) {
        this.THREE = THREE;
        this.game = game;
        this.animals = [];
        this.group = new THREE.Group();
    }

    spawnAnimalsForCountry(countryConfig, worldHeightFn) {
        // Clear previous
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        this.animals = [];

        const type = countryConfig.wildlifeType || 'deer';
        const count = 12;

        for (let i = 0; i < count; i++) {
            // Spawn in wilderness outskirts
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
            const dist = 90 + Math.random() * 150;
            const x = Math.cos(angle) * dist;
            const z = Math.sin(angle) * dist;

            const animal = this.createAnimal(type, x, z, worldHeightFn);
            this.animals.push(animal);
            this.group.add(animal.mesh);
        }
    }

    createAnimal(type, x, z, worldHeightFn) {
        const THREE = this.THREE;
        const mesh = new THREE.Group();

        let bodyColor = 0x8a6341;
        if (type === 'boar') bodyColor = 0x3d352e;
        if (type === 'wolf') bodyColor = 0x5a5b57;

        const mat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.8 });

        // Body
        const bodyGeom = new THREE.BoxGeometry(
            type === 'boar' ? 0.6 : 0.45,
            type === 'boar' ? 0.5 : 0.45,
            type === 'boar' ? 0.9 : 0.95
        );
        const body = new THREE.Mesh(bodyGeom, mat);
        body.position.y = type === 'boar' ? 0.45 : 0.65;
        body.castShadow = true;
        mesh.add(body);

        // Head & Neck
        const headGeom = new THREE.BoxGeometry(0.24, 0.26, 0.35);
        const head = new THREE.Mesh(headGeom, mat);
        head.position.set(0, type === 'boar' ? 0.35 : 0.8, 0.55);
        head.castShadow = true;
        mesh.add(head);

        // Antlers for Deer
        if (type === 'deer') {
            const antlerMat = new THREE.MeshStandardMaterial({ color: 0x2d2319 });
            const antlerL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), antlerMat);
            antlerL.position.set(-0.12, 0.2, 0);
            antlerL.rotation.z = -0.3;
            head.add(antlerL);

            const antlerR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.25, 0.04), antlerMat);
            antlerR.position.set(0.12, 0.2, 0);
            antlerR.rotation.z = 0.3;
            head.add(antlerR);
        }

        // 4 Legs
        const legGeom = new THREE.BoxGeometry(0.1, type === 'boar' ? 0.35 : 0.55, 0.1);
        const legs = [];
        const offsets = [
            [-0.18, 0.28], [0.18, 0.28],
            [-0.18, -0.28], [0.18, -0.28]
        ];

        offsets.forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(legGeom, mat);
            leg.position.set(lx, type === 'boar' ? 0.18 : 0.28, lz);
            leg.castShadow = true;
            mesh.add(leg);
            legs.push(leg);
        });

        mesh.position.set(x, worldHeightFn(x, z), z);

        return {
            type,
            mesh,
            legs,
            x,
            z,
            rotation: Math.random() * Math.PI * 2,
            speed: 0,
            state: 'graze', // 'graze', 'wander', 'flee'
            timer: Math.random() * 4,
            walkCycle: 0
        };
    }

    update(dt, playerPos, playerSpeedKmh, worldHeightFn) {
        this.animals.forEach(animal => {
            animal.timer -= dt;

            const distToPlayer = Math.hypot(animal.x - playerPos.x, animal.z - playerPos.z);

            // React to player proximity or fast approaching bicycle
            const alertRadius = playerSpeedKmh > 20 ? 35 : 18;
            if (distToPlayer < alertRadius) {
                animal.state = 'flee';
                // Run directly away from player
                animal.rotation = Math.atan2(animal.x - playerPos.x, animal.z - playerPos.z);
                animal.speed = animal.type === 'deer' ? 7.5 : animal.type === 'boar' ? 5.5 : 6.0;
            } else if (animal.timer <= 0) {
                // Change AI routine
                animal.timer = 3.0 + Math.random() * 5.0;
                if (Math.random() < 0.6) {
                    animal.state = 'graze';
                    animal.speed = 0;
                } else {
                    animal.state = 'wander';
                    animal.rotation += (Math.random() - 0.5) * 1.5;
                    animal.speed = 1.2;
                }
            }

            // Move
            if (animal.speed > 0) {
                animal.x += Math.sin(animal.rotation) * animal.speed * dt;
                animal.z += Math.cos(animal.rotation) * animal.speed * dt;

                // Animate 4 legs
                animal.walkCycle += dt * animal.speed * 4;
                animal.legs[0].rotation.x = Math.sin(animal.walkCycle) * 0.5;
                animal.legs[1].rotation.x = -Math.sin(animal.walkCycle) * 0.5;
                animal.legs[2].rotation.x = -Math.sin(animal.walkCycle) * 0.5;
                animal.legs[3].rotation.x = Math.sin(animal.walkCycle) * 0.5;
            }

            // Keep within map boundaries
            animal.x = Math.max(-280, Math.min(280, animal.x));
            animal.z = Math.max(-280, Math.min(280, animal.z));

            animal.mesh.position.x = animal.x;
            animal.mesh.position.z = animal.z;
            animal.mesh.position.y = worldHeightFn(animal.x, animal.z);
            animal.mesh.rotation.y = animal.rotation;
        });
    }
}
