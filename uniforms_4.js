var w = 600;
var h = 600;

const app = new PIXI.Application({
    width: w,
    height: h,
    backgroundColor: '0x86D0F2',
    transparent: true,
    antialias: true,
    autoResize: true,
    resolution: devicePixelRatio,
    resizeTo: window
});

document.body.appendChild(app.view);

// create the root of the scene graph
var stage = new PIXI.Container();

const geometry = new PIXI.Geometry()
    .addAttribute('aVertexPosition', // the attribute name
        [-100, -100, // x, y
            100, -100, // x, y
            100, 100,
        -100, 100], // x, y
        2) // the size of the attribute
    .addAttribute('aUvs', // the attribute name
        [0, 0, // u, v
            1, 0, // u, v
            1, 1,
            0, 1], // u, v
        2) // the size of the attribute
    .addIndex([0, 1, 2, 0, 2, 3]);

const vertexSrc = `

    precision mediump float;

    attribute vec2 aVertexPosition;
    attribute vec2 aUvs;

    uniform mat3 translationMatrix;
    uniform mat3 projectionMatrix;

    varying vec2 vUvs;
    varying vec4 position;

    void main() {

        vUvs = aUvs;
        position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
        gl_Position = position;

    }`;

const fragmentSrc = `

    precision mediump float;

    varying vec2 vUvs;
    varying vec4 position;

    uniform sampler2D uSampler2;
    uniform float time;
    uniform float circle_size;

    void main() {

        float dx = vUvs.x - 0.5;
        float dy = vUvs.y - 0.5;

        float x = mod(vUvs.x * 1.0,1.0);
        float y = mod(vUvs.y * 1.0,1.0);

        float r = 0.2 + 0.5 * sin(tan(x+y)*0.0 + circle_size * 0.1);
        float g = 0.2 + 0.5 * sin( 2.0*sin(y * 3.0) + time * 0.1);
        float b = 0.2 + 0.5 * sin( sin(x * 6.0) + time * 0.1);
        
        float distance = circle_size / 300.0 - sqrt(dx*dx + dy*dy);
        float alpha = distance * 10.0;
            gl_FragColor = vec4(r,g,b,alpha);
            //gl_FragColor = texture2D(uSampler2, vec2(x + 0.1*sin(time), y));

        //float distance2edge = abs(dx - 0.5) - 0.5;
        //gl_FragColor = vec4(0,1,0,pow(distance2edge * 2.0, 0.2));
    }`;


const lineFragmentSrc = `

    precision mediump float;

    varying vec2 vUvs;
    varying vec4 position;

    uniform sampler2D uSampler2;
    uniform float time;
    uniform float cycles;
    uniform float theta;
    uniform float m1;
    uniform float b1;
    uniform int phase;
    uniform int show_axes;
    uniform float rad;
    uniform float angle;
    uniform float a1;
    uniform float n1;
    uniform float c1;

    void main() {
        float x = vUvs.x - 0.5;
        float y = vUvs.y - 0.5;

        vec4 color = vec4(1,1,1,0);
        float theta2 = 360. - theta;

        float PI = 3.14159;
        float th = 2.*PI*theta2/360.;
        float qx = 10.*(x);
        float qy = 10.*y;
        
        float r = 1.; 
        float g = 1.;
        float b = 1.;

        float ax = 1.5*sqrt(qx*qx+qy*qy);
        float ay = atan(qy,-qx)+PI;

        if (phase==1) {
            float ay = qx;
            float ax = -qy;

            float slide = exp(th*th/5.);
            float h = 1.;
            qx = sqrt(ay*ay+(ax+slide-h)*(ax+slide-h))+h-slide;
            qy = atan(ay,ax+slide-h)*slide;

            const float lim = 4.;

            for (float i=0.; i<4.; i+=1.) {
                
                float by = qy-2.*PI*i+6.*PI;
                float f = c1/4.-a1/4.*sin(by*n1+time+cycles);
                float f2 = m1/4. * (by) *0. + b1/4.;
                if (abs(qy)<PI && abs(qx-1.)<1.) {
                    if (show_axes==1 && i==0.)
                    {
                        if (-cos(16.*qy+PI)>.98 || cos(4.*2.*PI*qx/1.)>.98) {
                            r=0.;
                            g=0.;
                        }
                    }
                    if (phase == 4) // sine
                    {
                        if (abs(qx-f)<.03) {
                            r = 0.5-.5*sin(2.*PI*i/4.);
                            g = 0.5-.5*sin(2.*PI*i/4.-2.*PI/3.);
                            b = 0.5-.5*sin(2.*PI*i/4.+2.*PI/3.);
                        }
                    }
                    if (phase == 2) // line
                    {
                        if (abs(qx - f2) < .03){
                            r = 0.5-.5*sin(2.*PI*i/4.);
                            g = 0.5-.5*sin(2.*PI*i/4.-2.*PI/3.);
                            b = 0.5-.5*sin(2.*PI*i/4.+2.*PI/3.);
                        }
                    }
                }
            }
        }

        if (phase>=2) {
            float ay = qx;
            float ax = -qy;

            float slide = exp(th*th/5.);
            float h = 1.;
            qx = sqrt(ay*ay+(ax+slide-h)*(ax+slide-h))+h-slide;
            qy = atan(ay,ax+slide-h)*slide;

            if (phase==5) {
                color = vec4(0.50,1.00,0.83,1.);
            }

            for (float i=0.; i<4.; i+=1.) {
                if (i<cycles) {
                float by = qy-2.*PI*i+6.*PI;
                if (phase == 2){
                    by = qy+2.*PI*i+6.*PI;
                }
                float f = c1/4.-a1/4.*sin(by*n1 - 0.2*time);
                float dfdx  = -1.*n1*a1/4.*cos(by*n1 - 0.2*time);
                float thick = sqrt(dfdx*dfdx+1.);
                float f2 = m1/4. * (by-5.*PI) + b1/4.;
                if (abs(qy)<PI && qx>0.) {
                    if (show_axes==1 && i==0.)
                    {
                        if (-cos(16.*qy+PI)>.98 || cos(4.*2.*PI*qx/1.)>.98) {
                            r=0.6;
                            g=0.6;
                        }
                    }
                    if (phase == 4) // sine
                    {
                        if (abs(qx-f)<.02*thick) {
                            r = 0.5-.5*sin(2.*PI*i/4.);
                            g = 0.5-.5*sin(2.*PI*i/4.-2.*PI/3.);
                            b = 0.5-.5*sin(2.*PI*i/4.+2.*PI/3.);
                        }
                    }
                    if (phase == 2) // line
                    {
                        if (abs(qx - f2) < .03){
                            r = 0.5-.5*sin(2.*PI*i/4.);
                            g = 0.5-.5*sin(2.*PI*i/4.-2.*PI/3.);
                            b = 0.5-.5*sin(2.*PI*i/4.+2.*PI/3.);
                        }
                    }
                }
                
            }}
        }

        color = vec4(r,g,b,1.);

        gl_FragColor = color;

    }`;

let leaves = PIXI.Texture.from('leaves.jpg');

const uniforms = {
    phase: 2,
    uSampler2: leaves,
    time: 0,
    cycles: 1,
    theta: 0,
    a1: 1,
    c1: 1,
    n1: 1,
    m1: 0,
    b1: 0,
    show_axes: 1,
    rad: 0,
    angle: 0
};

const circleShader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
const lineShader = PIXI.Shader.from(vertexSrc, lineFragmentSrc, uniforms);

const quad = new PIXI.Mesh(geometry, lineShader);

var withTime = false;

quad.position.set(w / 2, h / 2);
quad.scale.set(4);

app.stage.addChild(quad);
app.ticker.speed = 0;

app.ticker.add((delta) => {
    if (!isNaN(delta)) {
        quad.shader.uniforms.time = parseFloat(quad.shader.uniforms.time) + parseFloat(delta);
        if (app.ticker.speed > 0) {
            var rounded = (quad.shader.uniforms.time*0.1).toFixed(1);
            var thetaText = "time = " + rounded;
            document.getElementById("sliderTime").innerHTML = thetaText;
            document.getElementById("time").value = rounded;

            drawSineFunc();
        }
    }
});

document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("instructions").style.maxHeight = "250px";
    document.getElementById("instructions").style.padding = "0em 1em";
    document.getElementById("slidersPanel").style.maxHeight = "500px";
    document.getElementById("slidersPanel").style.padding = "0em 1em";
});


function handleSpeed(value) {
    app.ticker.speed = value;
}

function handleCycles(value) {
    quad.shader.uniforms.cycles = value;
}


function handleTime(value) {
    quad.shader.uniforms.time = value * 10;
    var rounded = (quad.shader.uniforms.time*0.1).toFixed(1);
    var thetaText = "time = " + rounded;
    document.getElementById("sliderTime").innerHTML = thetaText;
    drawSineFunc();
}

function drawSineFunc() {
    if (!withTime)
        var text = " y = " + (quad.shader.uniforms.a1) + " * sin(" + (quad.shader.uniforms.n1) + " * x) + " + (quad.shader.uniforms.c1);
    else
        var text = " y = " + (quad.shader.uniforms.a1) + " * sin(" + (quad.shader.uniforms.n1) + " * x + " + (quad.shader.uniforms.time*0.1).toFixed(1) + ") + " + (quad.shader.uniforms.c1);

    document.getElementById("equation").innerHTML = text;
}

var slider = document.getElementById("sliderInput");

function rgb(r, g, b) {
    return "rgb(" + r + "," + g + "," + b + ")";
}

function handleSlider(value) {
    quad.shader.uniforms.theta = value;

    color = rgb(255 * 0.3, 255 * (0.3 + 0.4 * value / 360.), 255 * 0.3);
    color2 = rgb(255 * 0.3, 255 * (0.3 + 0.4 * (360 - value) / 360.), 255 * 0.3);

    document.getElementById("sliderCart").style.color = color2;
    document.getElementById("sliderPol").style.color = color;

}

function handleLineMode(value) {
    quad.shader.uniforms.phase = 2;
    document.getElementById("slidersPhase2Line").style.display = "block";
    document.getElementById("slidersPhase2Sine").style.display = "none";

    var text = " y = " + (quad.shader.uniforms.m1) + " * x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
}

function handleSineMode(value) {
    quad.shader.uniforms.phase = 2;
    document.getElementById("slidersPhase2Line").style.display = "block";
    document.getElementById("slidersPhase2Sine").style.display = "none";

    drawSineFunc();
}

function handleArtMode(value) {
    quad.shader.uniforms.phase = 5;
    document.getElementById("slidersPhase2Line").style.display = "block";
    document.getElementById("slidersPhase2Sine").style.display = "none";

    drawSineFunc();
}

function handleASlider(value) {
    quad.shader.uniforms.a1 = value;

    drawSineFunc();
}

function handleNSlider(value) {
    quad.shader.uniforms.n1 = value;

    drawSineFunc();
}

function handleCSlider(value) {
    quad.shader.uniforms.c1 = value;

    drawSineFunc();
}

function handleMSlider(value) {
    quad.shader.uniforms.m1 = value;

    var text = " y = " + (quad.shader.uniforms.m1) + " * x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
}

function handleBSlider(value) {
    quad.shader.uniforms.b1 = value;

    var text = " y = " + (quad.shader.uniforms.m1) + " * x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
}

function handleRSlider(value) {
    quad.shader.uniforms.rad = value;
}

function handleTSlider(value) {
    quad.shader.uniforms.angle = value;
}

function handleTrianglePhase(value) {
    withTime = true;
    document.getElementById("panel1").style.display = "block";
    document.getElementById("panel2").style.display = "none";
    document.getElementById("slidersPhase1").style.display = "block";
    document.getElementById("slidersPhase2").style.display = "block";
    document.getElementById("equation").style.display = "block";
    document.getElementById("lineModeButtons").style.display = "none";
    document.getElementById("sine").checked = true;
    handleSineMode();
}

function handleArtPhase(value) {
    withTime = true;
    document.getElementById("panel1").style.display = "block";
    document.getElementById("panel2").style.display = "none";
    document.getElementById("slidersPhase1").style.display = "block";
    document.getElementById("slidersPhase2").style.display = "block";
    document.getElementById("equation").style.display = "block";
    document.getElementById("lineModeButtons").style.display = "block";
    document.getElementById("sine").checked = true;
    handleArtMode();
}

function handleCirclePhase(value) {
    if (withTime)
    {
        withTime = false;
        handleSineMode();
    }

    document.getElementById("panel1").style.display = "none";
    document.getElementById("panel2").style.display = "block";
    document.getElementById("slidersPhase1").style.display = "none";
    document.getElementById("slidersPhase2").style.display = "block";
    document.getElementById("equation").style.display = "block";
    document.getElementById("lineModeButtons").style.display = "inline-block";
}

function handleAxes(value) {
    var checkbox = document.getElementById("axes");
    if (checkbox.checked) {
        quad.shader.uniforms.show_axes = 1;
    } else {
        quad.shader.uniforms.show_axes = 0;
    }
}

function handleControls(value)
{
    var checkbox = document.getElementById("controls");
    if (checkbox.checked)
    {
        document.getElementById("instructions").style.padding = "0em 1em";
        document.getElementById("instructions").style.maxHeight = "250px";
        document.getElementById("slidersPanel").style.padding = "0em 1em";
        document.getElementById("slidersPanel").style.maxHeight = "500px";
    } 
    else
    {
        document.getElementById("instructions").style.padding = null;
        document.getElementById("instructions").style.maxHeight = null;
        document.getElementById("slidersPanel").style.maxHeight = null;
    }
}

// Listen for window resize events
window.addEventListener('resize', resize);

// Resize function window
function resize() {
    // Resize the renderer
    app.renderer.resize(window.innerWidth, window.innerHeight);

    // You can use the 'screen' property as the renderer visible
    // area, this is more useful than view.width/height because
    // it handles resolution
    quad.position.set(app.screen.width / 2, app.screen.height / 2);

    var ratio = app.screen.width / app.screen.height;

    var tall_side = app.screen.height;

    if (ratio > 1) {
        tall_side = app.screen.width;
    }

    quad.scale.set(tall_side / 200);

}

resize();

screen.orientation.addEventListener("change", function (e) {
    resize();
}, false);

let keysPressed = {};

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;

    if (keysPressed['Alt'] && event.key == '1') {
        alert("Mode 1");
        quad.shader = circleShader;
    }

    if (keysPressed['Alt'] && event.key == '2') {
        alert("Mode 2");
        quad.shader = lineShader;
    }
});

document.addEventListener('keyup', (event) => {
    delete keysPressed[event.key];
});