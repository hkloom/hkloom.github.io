var w = 600;
var h = 600;

const app = new PIXI.Application(  {width: w,
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
            
            if ((-cos(8.*ay+PI)>.98 || cos(2.*PI*ax/1.)>.98) && ax<4.) {
                r=0.;
                g=0.;
            }
            //float rad = 2.;
            float angle2 = angle / 180. * PI;
            float px = qx-rad/1.5*cos(-angle2);
            float py = qy-rad/1.5*sin(-angle2);
            float dist = sqrt(px*px+py*py);
            
            if (show_axes==1) {
                if (ax<1. && ay<angle2) {
                    r=1.;
                    g=1.;
                    b=0.5;
                }
                if (abs(angle2-ay)<.03 && ax<rad) {
                    r=0.;
                    g=.7;
                    b=0.2;
                }
            }

            if (dist<.1) {
                r=1.;
                g=0.;
                b=0.;
            }
        }

        if (phase>=2) {
            float ay = qx;
            float ax = -qy;

            float slide = exp(th);
            float h = 1.;
            qx = sqrt(ay*ay+(ax+slide-h)*(ax+slide-h))+h-slide;
            qy = atan(ay,ax+slide-h)*slide;

            for (float i=0.; i<4.; i+=1.) {
                
                float by = qy-2.*PI*i+6.*PI;
                float f = c1/4.-a1/4.*sin(by*n1);
                float f2 = m1/4. * by + b1/4.;
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
                            b=i/6.;
                            g=i/4.;
                        }
                    }
                    if (phase == 2) // line
                    {
                        if (abs(qx - f2) < .03){
                            b=i/6.;
                            g=i/4.;
                        }
                    }
                }
                
            }
        }

        color = vec4(r,g,b,1.);

        gl_FragColor = color;

    }`;

let leaves = PIXI.Texture.from('leaves.jpg');

const uniforms = {
    phase: 1,
    uSampler2: leaves,
    time: 0,
    theta: 0,
    a1: 0,
    c1: 0,
    n1: 0,
    m1: 0,
    b1: 0,
    show_axes: 1,
    rad: 0,
    angle: 0
};

const circleShader = PIXI.Shader.from(vertexSrc, fragmentSrc, uniforms);
const lineShader = PIXI.Shader.from(vertexSrc, lineFragmentSrc, uniforms);

const quad = new PIXI.Mesh(geometry, lineShader);

quad.position.set(w/2, h/2);
quad.scale.set(4);

app.stage.addChild(quad);

// start the animation..
// requestAnimationFrame(animate);

app.ticker.add((delta) => {
    quad.shader.uniforms.time += 0.0001;
});

var slider = document.getElementById("sliderInput");

function rgb(r, g, b){
    return "rgb("+r+","+g+","+b+")";
  }

function handleSlider (value)
{
    quad.shader.uniforms.theta = value;

    color = rgb(255 * 0.3, 255 * (0.3  + 0.4 * value / 360.), 255 * 0.3);
    color2 = rgb(255 * 0.3, 255 * (0.3  + 0.4 * (360 - value) / 360.), 255 * 0.3);

    document.getElementById("sliderCart").style.color = color2;
    document.getElementById("sliderPol").style.color = color;

}

function handleLineMode(value)
{
    quad.shader.uniforms.phase = 2;
    document.getElementById("slidersPhase2Line").style.display = "block";
    document.getElementById("slidersPhase2Sine").style.display = "none";
}

function handleSineMode(value)
{
    quad.shader.uniforms.phase = 4;
    document.getElementById("slidersPhase2Line").style.display = "none";
    document.getElementById("slidersPhase2Sine").style.display = "block";

    var text = " y = " + (quad.shader.uniforms.a1) + " * sin(" + (quad.shader.uniforms.n1) + " * x) + " + (quad.shader.uniforms.c1);
    document.getElementById("equation").innerHTML = text;
}

function handleASlider(value)
{
    quad.shader.uniforms.a1 = value;

    var text = " y = " + (quad.shader.uniforms.a1) + " * sin(" + (quad.shader.uniforms.n1) + " * x) + " + (quad.shader.uniforms.c1);
    document.getElementById("equation").innerHTML = text;
}

function handleNSlider(value)
{
    quad.shader.uniforms.n1 = value;

    var text = " y = " + (quad.shader.uniforms.a1) + " * sin(" + (quad.shader.uniforms.n1) + " * x) + " + (quad.shader.uniforms.c1);
    document.getElementById("equation").innerHTML = text;
}

function handleCSlider(value)
{
    quad.shader.uniforms.c1 = value;

    var text = " y = " + (quad.shader.uniforms.a1) + " * sin(" + (quad.shader.uniforms.n1) + " * x) + " + (quad.shader.uniforms.c1);
    document.getElementById("equation").innerHTML = text;
}

function handleMSlider(value)
{
    quad.shader.uniforms.m1 = value;

    var text = " y = " + (quad.shader.uniforms.m1) + "x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
}

function handleBSlider(value)
{
    quad.shader.uniforms.b1 = value;

    var text = " y = " + (quad.shader.uniforms.m1) + "x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
}

function handleRSlider(value)
{
    quad.shader.uniforms.rad = value;
}

function handleTSlider(value)
{
    quad.shader.uniforms.angle = value;
}

function handleTrianglePhase (value)
{
    quad.shader.uniforms.phase = 1;
    document.getElementById("panel1").style.display = "block";
    document.getElementById("panel2").style.display = "none";
    document.getElementById("slidersPhase1").style.display = "block";
    document.getElementById("slidersPhase2").style.display = "none";
    document.getElementById("equation").style.display = "none";
}

function handleCirclePhase (value)
{
    quad.shader.uniforms.phase = 2;
    document.getElementById("panel1").style.display = "none";
    document.getElementById("panel2").style.display = "block";
    document.getElementById("slidersPhase1").style.display = "none";
    document.getElementById("slidersPhase2").style.display = "block";
    document.getElementById("equation").style.display = "block";
}

function handleAxes( value )
{
    var checkbox = document.getElementById("axes");
    if (checkbox.checked)
    {
        quad.shader.uniforms.show_axes = 1;
    }else{
        quad.shader.uniforms.show_axes = 0;
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
  quad.position.set(app.screen.width/2, app.screen.height/2);

  var ratio = app.screen.width / app.screen.height;

  var tall_side = app.screen.height;

  if (ratio > 1){
    tall_side = app.screen.width;
  }

  quad.scale.set(tall_side/200);

}

resize();

screen.orientation.addEventListener("change", function(e) {
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