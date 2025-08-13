import * as THREE from 'https://unpkg.com/three@0.177.0/build/three.module.js';

const textContainer = document.getElementById("textContainer");

// control smoothly will react to the mouse movement 
let easeFactor = 0.02;

// to set up our three js enviroment
let scene, camera, renderer, planeMesh;

let mousePosition = {
    x: 0.5, 
    y: 0.5
};

let targetMousePosition  = {
    x: 0.5, 
    y: 0.5
};

let prevPosition  = {
    x: 0.5, 
    y: 0.5
};

// shaders
const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;


// fragment shaders -> handles the pixel by pixel manipulation
const fragmentShader = `
    varying vec2 vUv;
uniform sampler2D u_texture;
uniform vec2 u_mouse;
uniform vec2 u_prevMouse;

void main() {
    vec2 gridUV = floor(vUv * vec2(40.0, 40.0)) / vec2(40.0, 40.0);
    vec2 centerOfPixel = gridUV + vec2(1.0/40.0, 1.0/40.0);

    vec2 mouseDirection = u_mouse - u_prevMouse;

    vec2 pixelToMouseDirection = centerOfPixel - u_mouse;
    float pixelDistanceToMouse = length(pixelToMouseDirection);
    float strength = smoothstep(0.3, 0.0, pixelDistanceToMouse);

    vec2 uvOffset = strength * -mouseDirection * 0.3;
    vec2 uv = vUv - uvOffset;

    vec4 color = texture2D(u_texture, uv);
    gl_FragColor = color;
}

`;


// function for the animation
function createTextTexture(text, font, size, color, fontWeight = "100") {
    const canvas = document.createElement('canvas');

    const ctx = canvas.getContext('2d');

    const canvasWidth = window.innerWidth * 2;
    const canvasHeight = window.innerHeight * 2;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = color || "#ffffff";

    ctx.fillRect(0 ,0 , canvas.width, canvas.height);

    const fontSize = size || Math.floor(canvasWidth * 2);

    ctx.fillStyle = "#ffffff";
ctx.font = `${fontWeight} ${fontSize}px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;

    const scaleFactor = Math.min(1, (canvasWidth * 1) / textWidth);
    const aspectCorrection = canvasWidth / canvasHeight;

    ctx.setTransform(
        scaleFactor,
        0,
        0,
        scaleFactor / aspectCorrection,
        canvasWidth / 2,
        canvasHeight / 2
    );

    ctx.strokeStyle = "#ffffff";

    ctx.lineWidth = fontSize * 0.005;

    for (let i = 0; i < 3; i++) {
        ctx.strokeText(text,0,0);
ctx.fillText(text, 0, 0);

        return new THREE.CanvasTexture(canvas);
    }
}

// initialize scene
function initializeScene(texture) {
    scene = new THREE.Scene();

    const aspectRatio = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera(
        -1,
        1,
        1 / aspectRatio,
        -1 / aspectRatio,
        0.1,
        1000
    );
    camera.position.z = 1;

    let shaderUniforms = {
        u_mouse: {
            type: "v2", value: new THREE.Vector2() 
        },
        u_prevMouse : {
             type: "v2", value: new THREE.Vector2() 
        },
        u_texture :  { type: "t", value: texture }
    };
    planeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2,2),
        new THREE.ShaderMaterial({
            uniforms: shaderUniforms,
            vertexShader,
            fragmentShader,

        })
    )
    scene.add(planeMesh);

    renderer = new THREE.WebGLRenderer({
        antialias : true
    });
    renderer.setClearColor(0xffffff, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);

    renderer.setPixelRatio(window.devicePixelRatio);

    textContainer.appendChild(renderer.domElement);
}

function reloadTexture(){
    const newTexture = createTextTexture(
        "ARTIEL",
        "artiel",
        null,
        "#ffffff",
        "100"
    );
    planeMesh.material.uniforms.u_texture.value = newTexture;
}

initializeScene(
    createTextTexture("ARTIEL", "artiel", null, "#000000", "100")
);

function animateScene(){
    requestAnimationFrame(animateScene);

    mousePosition.x += (targetMousePosition.x - mousePosition.x) * easeFactor;

    mousePosition.y += (targetMousePosition.y - mousePosition.y ) * easeFactor;

    planeMesh.material.uniforms.u_mouse.value.set(
        mousePosition.x,
        1.0 - mousePosition.y
    );

    planeMesh.material.uniforms.u_prevMouse.value.set(
        prevPosition.x,
        1.0 - prevPosition.y
    );

    renderer.render(scene, camera);
}

animateScene()

textContainer.addEventListener("mousemove", handleMouseMove);
textContainer.addEventListener("mouseenter", handleMouseMove);
textContainer.addEventListener("mouseleave", handleMouseMove);

function handleMouseMove(event){
    easeFactor = 0.04;

    let rect = textContainer.getBoundingClientRect();
    prevPosition = { ...targetMousePosition };

    targetMousePosition.x = (event.clientX - rect.left) / rect.width;
    targetMousePosition.y = (event.clientY - rect.top) / rect.height;
}

function handleMouseEnter(event){
    easeFactor = 0.02;
    let rect = textContainer.getBoundingClientRect();

    
    mousePosition.x = targetMousePosition.x = (event.clientX = rect.left) / rect.width;
    mousePosition.y = targetMousePosition.y = (event.clientY = rect.top) / rect.height;
}

function handleMouseLeave(event){
    easeFactor = 0.02;
    targetMousePosition = {...prevPosition};
}