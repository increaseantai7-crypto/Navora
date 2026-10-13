import * as THREE from "three";

// ========================================
// NOVARA — THE REPUBLIC
// First City: Build 001
// ========================================

const container = document.getElementById("game-container");
const enterButton = document.getElementById("enter-world");
const welcomeScreen = document.getElementById("welcome-screen");
const gameHUD = document.getElementById("game-hud");
const mobileControls = document.getElementById("mobile-controls");
const messageBox = document.getElementById("message");

// ----------------------------------------
// GAME STATE
// ----------------------------------------

let gameStarted = false;
let cameraMode = 0;
let elapsedTime = 0;
let lastMessageTime = 0;

const keys = {};
const mobileInput = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

const playerState = {
    speed: 8,
    runMultiplier: 1.7,
    verticalVelocity: 0,
    grounded: true
};

// ----------------------------------------
// THREE.JS SCENE
// ----------------------------------------

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x8db4c4);
scene.fog = new THREE.Fog(0x8db4c4, 100, 330);

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    600
);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "low-power"
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 1.5)
);

renderer.shadowMap.enabled = false;

renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);

// ----------------------------------------
// LIGHTING
// ----------------------------------------

const ambientLight = new THREE.HemisphereLight(
    0xd9edff,
    0x52634c,
    2.1
);

scene.add(ambientLight);

const sunlight = new THREE.DirectionalLight(
    0xffedca,
    2.2
);

sunlight.position.set(80, 120, 40);

scene.add(sunlight);

// ----------------------------------------
// MATERIALS
// ----------------------------------------

const materials = {
    grass: new THREE.MeshLambertMaterial({
        color: 0x719568
    }),

    road: new THREE.MeshLambertMaterial({
        color: 0x303840
    }),

    sidewalk: new THREE.MeshLambertMaterial({
        color: 0xb5b7ae
    }),

    roadLine: new THREE.MeshBasicMaterial({
        color: 0xf2d58c
    }),

    building: [
        0xd4d0c4,
        0xc4d2d9,
        0xe0c6a8,
        0x9daeb7,
        0xd6d8d0,
        0xb7c7b8
    ].map(color => new THREE.MeshLambertMaterial({
        color
    })),

    window: new THREE.MeshBasicMaterial({
        color: 0x8bc9db
    }),

    darkWindow: new THREE.MeshBasicMaterial({
        color: 0x526b7a
    })
};

// ----------------------------------------
// GROUND
// ----------------------------------------

function createBox(
    width,
    height,
    depth,
    material,
    x,
    y,
    z
) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );

    mesh.position.set(x, y, z);

    scene.add(mesh);

    return mesh;
}

createBox(
    500,
    1,
    500,
    materials.grass,
    0,
    -0.55,
    0
);

// ----------------------------------------
// ROADS
// ----------------------------------------

const roadWidth = 14;
const roadSpacing = 54;
const roadLength = 340;

function createRoads() {
    for (let i = -3; i <= 3; i++) {
        const position = i * roadSpacing;

        // North-south road
        createBox(
            roadWidth,
            0.12,
            roadLength,
            materials.road,
            position,
            0.03,
            0
        );

        // East-west road
        createBox(
            roadLength,
            0.12,
            roadWidth,
            materials.road,
            0,
            0.03,
            position
        );

        // Sidewalks beside north-south roads
        for (const side of [-1, 1]) {
            createBox(
                2.5,
                0.2,
                roadLength,
                materials.sidewalk,
                position + side * 8.25,
                0.08,
                0
            );

            // Sidewalks beside east-west roads
            createBox(
                roadLength,
                0.2,
                2.5,
                materials.sidewalk,
                0,
                0.08,
                position + side * 8.25
            );
        }

        // Road center markings
        for (
            let z = -roadLength / 2;
            z < roadLength / 2;
            z += 12
        ) {
            createBox(
                0.22,
                0.03,
                5,
                materials.roadLine,
                position,
                0.105,
                z
            );
        }

        for (
            let x = -roadLength / 2;
            x < roadLength / 2;
            x += 12
        ) {
            createBox(
                5,
                0.03,
                0.22,
                materials.roadLine,
                x,
                0.105,
                position
            );
        }
    }
}

createRoads();

// ----------------------------------------
// CITY BUILDINGS
// ----------------------------------------

const buildingColliders = [];

function createBuilding(x, z, width, depth, height) {
    const material = materials.building[
        Math.floor(Math.random() * materials.building.length)
    ];

    // Main building
    const building = createBox(
        width,
        height,
        depth,
        material,
        x,
        height / 2,
        z
    );

    building.userData.isBuilding = true;

    buildingColliders.push({
        x,
        z,
        halfWidth: width / 2,
        halfDepth: depth / 2
    });

    // Roof
    createBox(
        width + 0.5,
        0.7,
        depth + 0.5,
        new THREE.MeshLambertMaterial({
            color: 0x59646b
        }),
        x,
        height + 0.35,
        z
    );

    // Front-facing windows
    const floors = Math.floor(height / 4);

    const columns = Math.max(
        2,
        Math.floor(width / 3)
    );

    for (let floor = 0; floor < floors; floor++) {
        for (let column = 0; column < columns; column++) {
            const windowWidth = 0.9;
            const windowHeight = 1.4;

            const wx =
                x -
                width / 2 +
                ((column + 1) * width) / (columns + 1);

            const wy = 2.3 + floor * 3.6;

            if (wy > height - 1) continue;

            // Front face
            createBox(
                windowWidth,
                windowHeight,
                0.08,
                materials.window,
                wx,
                wy,
                z + depth / 2 + 0.05
            );

            // Back face
            createBox(
                windowWidth,
                windowHeight,
                0.08,
                materials.darkWindow,
                wx,
                wy,
                z - depth / 2 - 0.05
            );
        }
    }

    // Building sign on the front
    const signMaterial = new THREE.MeshBasicMaterial({
        color: 0x203d43
    });

    createBox(
        Math.min(width * 0.7, 8),
        1.2,
        0.18,
        signMaterial,
        x,
        Math.min(height - 1, 4),
        z + depth / 2 + 0.15
    );

    return building;
}

function generateCity() {
    for (let gridX = -3; gridX < 3; gridX++) {
        for (let gridZ = -3; gridZ < 3; gridZ++) {
            const blockX = gridX * roadSpacing;
            const blockZ = gridZ * roadSpacing;

            // Leave a central public square
            if (
                Math.abs(blockX) < 30 &&
                Math.abs(blockZ) < 30
            ) {
                continue;
            }

            const buildingCount = 2 + Math.floor(
                Math.random() * 3
            );

            for (let i = 0; i < buildingCount; i++) {
                const width = 10 + Math.random() * 10;
                const depth = 10 + Math.random() * 10;

                const height = 10 + Math.random() * 38;

                const offsetX =
                    (Math.random() - 0.5) * 28;

                const offsetZ =
                    (Math.random() - 0.5) * 28;

                const x = blockX + offsetX;
                const z = blockZ + offsetZ;

                // Avoid buildings overlapping the roads
                if (
                    Math.abs(x % roadSpacing) < 12 ||
                    Math.abs(z % roadSpacing) < 12
                ) {
                    continue;
                }

                createBuilding(
                    x,
                    z,
                    width,
                    depth,
                    height
                );
            }
        }
    }
}

generateCity();

// ----------------------------------------
// CENTRAL PUBLIC SQUARE
// ----------------------------------------

createBox(
    34,
    0.15,
    34,
    materials.sidewalk,
    0,
    0.05,
    0
);

// Decorative plaza tiles
for (let x = -12; x <= 12; x += 6) {
    for (let z = -12; z <= 12; z += 6) {
        createBox(
            5.5,
            0.08,
            5.5,
            new THREE.MeshLambertMaterial({
                color: (x + z) % 2 === 0
                    ? 0xc7c6b7
                    : 0xd8d6c8
            }),
            x,
            0.15,
            z
        );
    }
}

// A simple landmark
createBox(
    3,
    12,
    3,
    new THREE.MeshLambertMaterial({
        color: 0x314a53
    }),
    0,
    6,
    0
);

createBox(
    8,
    1,
    8,
    new THREE.MeshLambertMaterial({
        color: 0xd8b56d
    }),
    0,
    12.5,
    0
);

// ----------------------------------------
// PLAYER CHARACTER
// ----------------------------------------

const player = new THREE.Group();

const skinMaterial = new THREE.MeshLambertMaterial({
    color: 0x8b5a3c
});

const clothingMaterial = new THREE.MeshLambertMaterial({
    color: 0x263d52
});

const trousersMaterial = new THREE.MeshLambertMaterial({
    color: 0x252c32
});

const shoesMaterial = new THREE.MeshLambertMaterial({
    color: 0x17191b
});

// Torso
const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.55, 0.8, 4, 8),
    clothingMaterial
);

torso.position.y = 1.45;
player.add(torso);

// Head
const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 12, 10),
    skinMaterial
);

head.position.y = 2.55;
player.add(head);

// Legs
const leftLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.8, 0.38),
    trousersMaterial
);

leftLeg.position.set(-0.2, 0.55, 0);
player.add(leftLeg);

const rightLeg = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.8, 0.38),
    trousersMaterial
);

rightLeg.position.set(0.2, 0.55, 0);
player.add(rightLeg);

// Arms
const leftArm = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.13, 0.55, 3, 6),
    clothingMaterial
);

leftArm.position.set(-0.67, 1.48, 0);
leftArm.rotation.z = 0.15;
player.add(leftArm);

const rightArm = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.13, 0.55, 3, 6),
    clothingMaterial
);

rightArm.position.set(0.67, 1.48, 0);
rightArm.rotation.z = -0.15;
player.add(rightArm);

// Shoes
const leftShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.18, 0.48),
    shoesMaterial
);

leftShoe.position.set(-0.2, 0.12, 0.04);
player.add(leftShoe);

const rightShoe = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.18, 0.48),
    shoesMaterial
);

rightShoe.position.set(0.2, 0.12, 0.04);
player.add(rightShoe);

// Spawn point
player.position.set(20, 0, 20);

scene.add(player);

// ----------------------------------------
// CAMERA SYSTEM
// ----------------------------------------

const cameraNames = [
    "THIRD PERSON",
    "FIRST PERSON",
    "FRONT VIEW",
    "OVERHEAD VIEW"
];

function showMessage(message) {
    messageBox.textContent = message;
    messageBox.classList.add("visible");

    lastMessageTime = performance.now();
}

function updateCamera() {
    const playerPosition = player.position;

    if (cameraMode === 0) {
        // Third-person view
        camera.position.set(
            playerPosition.x,
            playerPosition.y + 5,
            playerPosition.z + 9
        );

        camera.lookAt(
            playerPosition.x,
            playerPosition.y + 1.4,
            playerPosition.z
        );
    }

    else if (cameraMode === 1) {
        // First-person approximation
        camera.position.set(
            playerPosition.x,
            playerPosition.y + 2.3,
            playerPosition.z
        );

        const direction = new THREE.Vector3(0, 0, -1);

        direction.applyQuaternion(player.quaternion);

        camera.lookAt(
            camera.position.clone().add(direction)
        );
    }

    else if (cameraMode === 2) {
        // Front-facing camera
        camera.position.set(
            playerPosition.x,
            playerPosition.y + 2.5,
            playerPosition.z - 7
        );

        camera.lookAt(
            playerPosition.x,
            playerPosition.y + 1.3,
            playerPosition.z
        );
    }

    else {
        // Overhead view
        camera.position.set(
            playerPosition.x,
            playerPosition.y + 28,
            playerPosition.z + 0.1
        );

        camera.lookAt(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z
        );
    }
}

function cycleCamera() {
    cameraMode = (cameraMode + 1) % cameraNames.length;

    showMessage("CAMERA: " + cameraNames[cameraMode]);
}

// ----------------------------------------
// COLLISION DETECTION
// ----------------------------------------

function collidesWithBuilding(x, z) {
    const playerRadius = 0.65;

    for (const building of buildingColliders) {
        const closestX = THREE.MathUtils.clamp(
            x,
            building.x - building.halfWidth,
            building.x + building.halfWidth
        );

        const closestZ = THREE.MathUtils.clamp(
            z,
            building.z - building.halfDepth,
            building.z + building.halfDepth
        );

        const dx = x - closestX;
        const dz = z - closestZ;

        if (
            dx * dx + dz * dz <
            playerRadius * playerRadius
        ) {
            return true;
        }
    }

    return false;
}

// ----------------------------------------
// KEYBOARD CONTROLS
// ----------------------------------------

window.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"]
            .includes(event.code)
    ) {
        event.preventDefault();
    }

    if (event.repeat) return;

    if (event.code === "KeyV") {
        cycleCamera();
    }

    if (event.code === "Space" && playerState.grounded) {
        playerState.verticalVelocity = 7;
        playerState.grounded = false;
    }
});

window.addEventListener("keyup", event => {
    keys[event.code] = false;
});

window.addEventListener("blur", () => {
    for (const key in keys) {
        keys[key] = false;
    }

    for (const direction in mobileInput) {
        mobileInput[direction] = false;
    }
});

// ----------------------------------------
// MOBILE CONTROLS
// ----------------------------------------

document.querySelectorAll("[data-move]").forEach(button => {
    const direction = button.dataset.move;

    const start = event => {
        event.preventDefault();
        mobileInput[direction] = true;
    };

    const stop = event => {
        event.preventDefault();
        mobileInput[direction] = false;
    };

    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
    button.addEventListener("contextmenu", event => {
        event.preventDefault();
    });
});

const jumpButton = document.getElementById("jump-button");

jumpButton.addEventListener("pointerdown", event => {
    event.preventDefault();

    if (playerState.grounded) {
        playerState.verticalVelocity = 7;
        playerState.grounded = false;
    }
});

jumpButton.addEventListener("pointerup", event => {
    event.preventDefault();
});

function setupMobileControls() {
    const isTouchDevice =
        window.matchMedia("(pointer: coarse)").matches;

    mobileControls.hidden = !isTouchDevice;
}

// ----------------------------------------
// PLAYER MOVEMENT
// ----------------------------------------

function updatePlayer(delta) {
    const forward =
        keys["KeyW"] ||
        keys["ArrowUp"] ||
        mobileInput.forward;

    const backward =
        keys["KeyS"] ||
        keys["ArrowDown"] ||
        mobileInput.backward;

    const left =
        keys["KeyA"] ||
        keys["ArrowLeft"] ||
        mobileInput.left;

    const right =
        keys["KeyD"] ||
        keys["ArrowRight"] ||
        mobileInput.right;

    const inputX = Number(right) - Number(left);
    const inputZ = Number(backward) - Number(forward);

    const inputLength = Math.hypot(inputX, inputZ);

    const movement = new THREE.Vector3();

    if (inputLength > 0) {
        movement.set(
            inputX / inputLength,
            0,
            inputZ / inputLength
        );

        const running =
            keys["ShiftLeft"] ||
            keys["ShiftRight"];

        const speed = playerState.speed *
            (running ? playerState.runMultiplier : 1);

        const moveX = movement.x * speed * delta;
        const moveZ = movement.z * speed * delta;

        const nextX = player.position.x + moveX;
        const nextZ = player.position.z + moveZ;

        // Check X and Z separately so the player
        // can slide around building corners.
        if (!collidesWithBuilding(nextX, player.position.z)) {
            player.position.x = nextX;
        }

        if (!collidesWithBuilding(player.position.x, nextZ)) {
            player.position.z = nextZ;
        }

        // Face the direction of movement.
        player.rotation.y = Math.atan2(
            movement.x,
            movement.z
        );
    }

    // Simple jump physics
    if (!playerState.grounded) {
        playerState.verticalVelocity -= 18 * delta;

        player.position.y +=
            playerState.verticalVelocity * delta;

        if (player.position.y <= 0) {
            player.position.y = 0;
            playerState.verticalVelocity = 0;
            playerState.grounded = true;
        }
    }
}

// ----------------------------------------
// GAME CLOCK
// ----------------------------------------

function updateGameClock(delta) {
    elapsedTime += delta;

    const totalMinutes = Math.floor(
        (8 * 60 + elapsedTime * 2) % (24 * 60)
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    document.getElementById("game-time").textContent =
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0");

    document.getElementById("game-day").textContent =
        String(Math.floor(elapsedTime / 720) + 1);
}

// ----------------------------------------
// ENTER NOVARA
// ----------------------------------------

enterButton.addEventListener("click", () => {
    gameStarted = true;

    welcomeScreen.style.display = "none";
    gameHUD.hidden = false;

    setupMobileControls();

    showMessage("WELCOME TO NOVARA CITY");

    updateCamera();
});

// ----------------------------------------
// WINDOW RESIZING
// ----------------------------------------

window.addEventListener("resize", () => {
    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    setupMobileControls();
});

// ----------------------------------------
// MAIN GAME LOOP
// ----------------------------------------

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.05);

    if (gameStarted) {
        updatePlayer(delta);
        updateCamera();
        updateGameClock(delta);

        if (
            lastMessageTime > 0 &&
            performance.now() - lastMessageTime > 2500
        ) {
            messageBox.classList.remove("visible");
            lastMessageTime = 0;
        }
    } else {
        // Show the city while the welcome screen is open.
        const time = performance.now() * 0.0001;

        camera.position.set(
            75 * Math.sin(time),
            42,
            75 * Math.cos(time)
        );

        camera.lookAt(0, 4, 0);
    }

    renderer.render(scene, camera);
}

setupMobileControls();
animate();

console.log("NOVARA initialized successfully.");