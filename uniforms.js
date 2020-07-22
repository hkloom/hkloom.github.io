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
    uniform float m1;
    uniform float b1;

    void main() {

        float x = vUvs.x - 0.5;
        float y = vUvs.y - 0.5;

        vec4 color = vec4(1,1,1,0);


        // y = x
        float f = y - ( x );

        //distance point to line:
        // line: ax + by + c = 0, point: x0, y0
        // y = -a/b*x - c/b
        // let b = 1, c = 0
        // distance = abs(ax0 + y0) / sqrt(a*a + 1)

        float a = m1;
        float distance = abs( y + (a * x) + b1 * 0.05) / sqrt(a*a + 1.0) - 0.001;
        float r = 0.2 + 0.5 * sin( x * y * 0.1 + time * 0.02);
        float g = 0.2 + 0.5 * sin( 0.1*sin(y * 0.1) + time * 0.015);
        float b = 0.2 + 0.5 * sin( sin(x * 0.2) + time * 0.01);
        float alpha = 1.0 - distance * 30.0;
        if (abs(x) < 0.0005 || abs(y) < 0.0005)
        {
            color = vec4(0,0,0,1);
        }
        else if ((abs(x) < 0.01 || abs(y) < 0.01) && (mod(y,0.05) < 0.001 || mod(x,0.05) < 0.001))
        {
            color = vec4(0,0,0,1);
        }
        else if ((abs(x) < 0.005 || abs(y) < 0.005) && (mod(y,0.025) < 0.001 || mod(x,0.025) < 0.001))
        {
            color = vec4(0,0,0,1);
        }
        else if (distance < 10.0)
        {
            color = vec4(r,g,b,alpha);
        }

  

        gl_FragColor = color;

    }`;

let leaves = PIXI.Texture.from('leaves.jpg');

const uniforms = {
    uSampler2: leaves,
    time: 0,
    m1: 0,
    b1: 0
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
    quad.shader.uniforms.time += 0.1;
});

var slider = document.getElementById("sliderInput");

function handleSlider (value)
{
    quad.shader.uniforms.m1 = value;
    var text = " y<sub>1</sub> = " + (value) + "x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
}

function handleB1 (value)
{
    quad.shader.uniforms.b1 = value;
    var text = " y<sub>1</sub> = " + (quad.shader.uniforms.m1) + "x";
    text += ((quad.shader.uniforms.b1 >= 0) ? " + " : " - ") + Math.abs(quad.shader.uniforms.b1);
    document.getElementById("equation").innerHTML = text;
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