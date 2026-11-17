// 3D Procedural Traveler Player Model & Procedural IK Animation
export class Player {
    constructor(THREE, game) {
        this.THREE = THREE;
        this.game = game;
        this.mesh = new THREE.Group();

        // State Machine
        this.isRiding = true; // true: On bicycle, false: On foot
        this.position = new THREE.Vector3(0, 0, 0);
        this.rotation = 0;
        this.walkSpeed = 3.5;
        this.sprintSpeed = 6.2;
        this.speed = 0;
        this.walkCycle = 0;

        // Survival Vitals
        this.vitals = {
            health: 100,
            maxHealth: 100,
            stamina: 100,
            maxStamina: 100,
            hunger: 85,
            thirst: 85,
            fatigue: 15,
            temperature: 37.0 // Celsius
        };

        // 3D Sub-components
        this.torso = null;
        this.head = null;
        this.backpack = null;
        this.leftThigh = null;
        this.leftShin = null;
        this.rightThigh = null;
        this.rightShin = null;
        this.leftArm = null;
        this.rightArm = null;

        this.buildModel();
    }

    buildModel() {
        const THREE = this.THREE;
        const g = this.mesh;

        // Materials
        const jacketColor = 0x3f4e42; // Weathered dark olive jacket
        const pantsColor = 0x2b332b; // Dark canvas trousers
        const skinColor = 0xbd997e;
        const packColor = 0x6e5d48; // Rugged leather/canvas pack
        const bootColor = 0x1f1a17;

        const matJacket = new THREE.MeshStandardMaterial({ color: jacketColor, roughness: 0.8 });
        const matPants = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.9 });
        const matSkin = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
        const matPack = new THREE.MeshStandardMaterial({ color: packColor, roughness: 0.85 });
        const matBoot = new THREE.MeshStandardMaterial({ color: bootColor, roughness: 0.7 });

        // 1. Pelvis / Lower Body
        this.pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.18), matPants);
        this.pelvis.position.set(0, 0.82, -0.22);
        this.pelvis.castShadow = true;
        g.add(this.pelvis);

        // 2. Torso & Jacket
        this.torso = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.38, 0.2), matJacket);
        this.torso.position.set(0, 0.24, 0.04);
        this.torso.castShadow = true;
        this.pelvis.add(this.torso);

        // 3. Backpack on Back
        this.backpack = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.15), matPack);
        this.backpack.position.set(0, 0.02, -0.16);
        this.backpack.castShadow = true;
        this.torso.add(this.backpack);

        // Rolled Sleeping Mat atop Backpack
        const bedroll = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 12), matPack);
        bedroll.rotation.z = Math.PI / 2;
        bedroll.position.set(0, 0.2, -0.16);
        this.torso.add(bedroll);

        // 4. Neck & Head with Explorer Cap
        this.head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, 0.16), matSkin);
        this.head.position.set(0, 0.28, 0.02);
        this.head.castShadow = true;
        this.torso.add(this.head);

        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.22), matJacket);
        cap.position.set(0, 0.1, 0.02);
        this.head.add(cap);

        // 5. Left Leg
        this.leftThigh = new THREE.Group();
        this.leftThigh.position.set(-0.1, -0.06, 0);
        const lThighMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), matPants);
        lThighMesh.position.set(0, -0.14, 0);
        lThighMesh.castShadow = true;
        this.leftThigh.add(lThighMesh);

        this.leftShin = new THREE.Group();
        this.leftShin.position.set(0, -0.28, 0);
        const lShinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.09), matPants);
        lShinMesh.position.set(0, -0.14, 0);
        lShinMesh.castShadow = true;
        this.leftShin.add(lShinMesh);

        const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.18), matBoot);
        lBoot.position.set(0, -0.28, 0.04);
        lBoot.castShadow = true;
        this.leftShin.add(lBoot);
        this.leftThigh.add(this.leftShin);
        this.pelvis.add(this.leftThigh);

        // 6. Right Leg
        this.rightThigh = new THREE.Group();
        this.rightThigh.position.set(0.1, -0.06, 0);
        const rThighMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), matPants);
        rThighMesh.position.set(0, -0.14, 0);
        rThighMesh.castShadow = true;
        this.rightThigh.add(rThighMesh);

        this.rightShin = new THREE.Group();
        this.rightShin.position.set(0, -0.28, 0);
        const rShinMesh = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.28, 0.09), matPants);
        rShinMesh.position.set(0, -0.14, 0);
        rShinMesh.castShadow = true;
        this.rightShin.add(rShinMesh);

        const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.18), matBoot);
        rBoot.position.set(0, -0.28, 0.04);
        rBoot.castShadow = true;
        this.rightShin.add(rBoot);
        this.rightThigh.add(this.rightShin);
        this.pelvis.add(this.rightThigh);

        // 7. Arms & Hands Gripping Handlebars
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.18, 0.16, 0);
        const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), matJacket);
        lUpperArm.position.set(0, -0.12, 0.04);
        this.leftArm.add(lUpperArm);
        const lForearm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), matJacket);
        lForearm.position.set(0, -0.26, 0.14);
        this.leftArm.add(lForearm);
        this.torso.add(this.leftArm);

        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.18, 0.16, 0);
        const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.26, 0.08), matJacket);
        rUpperArm.position.set(0, -0.12, 0.04);
        this.rightArm.add(rUpperArm);
        const rForearm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.07), matJacket);
        rForearm.position.set(0, -0.26, 0.14);
        this.rightArm.add(rForearm);
        this.torso.add(this.rightArm);
    }

    mountBicycle(bicycle) {
        this.isRiding = true;
        this.mesh.parent?.remove(this.mesh);
        bicycle.mesh.add(this.mesh);
        this.mesh.position.set(0, 0, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.pelvis.position.set(0, 0.82, -0.22);
    }

    dismountBicycle(scene, bicycle) {
        this.isRiding = false;
        bicycle.mesh.remove(this.mesh);
        scene.add(this.mesh);
        // Position rider beside the bicycle
        this.position.copy(bicycle.position).add(
            new this.THREE.Vector3(-0.6 * Math.cos(bicycle.rotation), 0, 0.6 * Math.sin(bicycle.rotation))
        );
        this.rotation = bicycle.rotation;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
        this.pelvis.position.set(0, 0.82, 0);
    }

    update(dt, input, bicycle, worldHeightFn, currentSurface) {
        const v = this.vitals;

        if (this.isRiding) {
            // RIDING MODE IK ANIMATION
            const isSprinting = input.sprint && Math.abs(bicycle.speed) > 2;

            // Lean torso forward when fast or sprinting
            this.torso.rotation.x = isSprinting ? 0.65 : 0.35;
            this.pelvis.position.y = isSprinting ? 0.92 : 0.82;
            this.pelvis.position.z = isSprinting ? -0.16 : -0.22;

            // Arm reaching to handlebars
            this.leftArm.rotation.x = 0.65 + (bicycle.steerAngle * 0.3);
            this.rightArm.rotation.x = 0.65 - (bicycle.steerAngle * 0.3);

            // Animate pedaling legs based on crank angle
            const crankAngle = bicycle.crankGroup ? bicycle.crankGroup.rotation.x : 0;
            this.leftThigh.rotation.x = Math.sin(crankAngle) * 0.5 + 0.4;
            this.leftShin.rotation.x = Math.max(0, -Math.sin(crankAngle) * 0.8);
            this.rightThigh.rotation.x = Math.sin(crankAngle + Math.PI) * 0.5 + 0.4;
            this.rightShin.rotation.x = Math.max(0, -Math.sin(crankAngle + Math.PI) * 0.8);

            // Stamina drain from pedaling
            if (input.forward) {
                const drainMultiplier = isSprinting ? 12.0 : 4.0;
                v.stamina = Math.max(0, v.stamina - drainMultiplier * dt);
            } else {
                // Stamina recovery when coasting
                v.stamina = Math.min(v.maxStamina, v.stamina + 8.0 * dt);
            }

            // Sync world coordinates
            this.position.copy(bicycle.position);
            this.rotation = bicycle.rotation;

        } else {
            // ON-FOOT WALKING / RUNNING MODE
            let moveSpeed = input.sprint ? this.sprintSpeed : this.walkSpeed;
            let moveDir = new this.THREE.Vector3();

            if (input.forward) moveDir.z += 1;
            if (input.backward) moveDir.z -= 1;
            if (input.left) moveDir.x += 1;
            if (input.right) moveDir.x -= 1;

            if (moveDir.lengthSq() > 0) {
                moveDir.normalize();
                const targetRot = Math.atan2(moveDir.x, moveDir.z);
                this.rotation = targetRot;

                this.position.x += Math.sin(this.rotation) * moveSpeed * dt;
                this.position.z += Math.cos(this.rotation) * moveSpeed * dt;

                // Walk cycle animation
                this.walkCycle += dt * (input.sprint ? 14 : 9);
                this.leftThigh.rotation.x = Math.sin(this.walkCycle) * 0.6;
                this.rightThigh.rotation.x = -Math.sin(this.walkCycle) * 0.6;
                this.leftArm.rotation.x = -Math.sin(this.walkCycle) * 0.5;
                this.rightArm.rotation.x = Math.sin(this.walkCycle) * 0.5;

                // Stamina drain
                if (input.sprint) {
                    v.stamina = Math.max(0, v.stamina - 10.0 * dt);
                }
            } else {
                // Standing idle
                this.leftThigh.rotation.x = 0;
                this.rightThigh.rotation.x = 0;
                this.leftArm.rotation.x = 0;
                this.rightArm.rotation.x = 0;
                v.stamina = Math.min(v.maxStamina, v.stamina + 12.0 * dt);
            }

            this.position.y = worldHeightFn(this.position.x, this.position.z);
            this.mesh.position.copy(this.position);
            this.mesh.rotation.y = this.rotation;
        }

        // Natural Metabolic Drain (Hunger, Thirst, Fatigue)
        v.hunger = Math.max(0, v.hunger - 0.08 * dt);
        v.thirst = Math.max(0, v.thirst - 0.14 * dt);
        v.fatigue = Math.min(100, v.fatigue + 0.04 * dt);

        // Starvation & Dehydration Health Damage
        if (v.hunger <= 0 || v.thirst <= 0) {
            v.health = Math.max(0, v.health - 1.5 * dt);
        }
    }
}
