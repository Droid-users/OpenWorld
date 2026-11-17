// Three.js Scene, Camera Controller & Post-Process Shading
export class Renderer {
    constructor(THREE, canvasContainer) {
        this.THREE = THREE;
        this.container = canvasContainer;

        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0xa8b89d, 0.005);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            650
        );

        // WebGL Renderer
        this.webgl = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.webgl.setSize(window.innerWidth, window.innerHeight);
        this.webgl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.webgl.shadowMap.enabled = true;
        this.webgl.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.webgl.domElement);

        // Camera Orbit & Follow Controller
        this.cameraDistance = 4.2;
        this.cameraHeight = 1.8;
        this.cameraPitch = 0.15; // Vertical look angle (radians)
        this.cameraYaw = 0; // Horizontal orbit offset
        this.cameraTarget = new THREE.Vector3();
        this.currentCamPos = new THREE.Vector3(0, 5, -10);

        window.addEventListener('resize', () => this.onResize());
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.webgl.setSize(window.innerWidth, window.innerHeight);
    }

    updateCamera(dt, targetPos, targetRotation, mouseDelta, isRiding) {
        const THREE = this.THREE;

        // Handle mouse look orbit
        this.cameraYaw -= mouseDelta.x * 0.0035;
        this.cameraPitch = Math.max(-0.4, Math.min(0.85, this.cameraPitch + mouseDelta.y * 0.0025));

        // When riding, camera yaw softly tracks behind bicycle direction if not moving mouse
        if (Math.abs(mouseDelta.x) < 0.01) {
            this.cameraYaw += (0 - this.cameraYaw) * Math.min(1.0, 3.0 * dt);
        }

        const totalYaw = targetRotation + this.cameraYaw;

        // Desired camera position behind target
        const dist = isRiding ? 4.4 : 3.2;
        const height = isRiding ? 1.7 : 1.6;

        const targetX = targetPos.x - Math.sin(totalYaw) * Math.cos(this.cameraPitch) * dist;
        const targetY = targetPos.y + height + Math.sin(this.cameraPitch) * dist;
        const targetZ = targetPos.z - Math.cos(totalYaw) * Math.cos(this.cameraPitch) * dist;

        const desiredPos = new THREE.Vector3(targetX, Math.max(targetPos.y + 0.4, targetY), targetZ);

        // Smooth follow lerp
        this.currentCamPos.lerp(desiredPos, Math.min(1.0, 10.0 * dt));
        this.camera.position.copy(this.currentCamPos);

        // Look at rider chest/head
        this.cameraTarget.copy(targetPos).add(new THREE.Vector3(0, 1.2, 0));
        this.camera.lookAt(this.cameraTarget);
    }

    render() {
        this.webgl.render(this.scene, this.camera);
    }
}
