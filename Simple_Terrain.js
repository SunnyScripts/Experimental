import * as mat4 from './gl-matrix/mat4.js';
import {terrainVertex, terrainFrag} from "./Shader_Source.js";
//import * as vec3 from './gl-matrix/vec3.js';

let playerPosition = {x: 0, y: 0};

const off = 0, on = 1;
const wKey = 87, sKey = 83, aKey = 65, dKey = 68;
let keyState = {};
keyState[wKey] = off; keyState[sKey] = off; keyState[aKey] = off; keyState[dKey] = off;

window.addEventListener('keydown', function(event)
{
    switch (event.keyCode)
    {
        case wKey:
            keyState[wKey] = on;
            break;
        case sKey:
            keyState[sKey] = on;
            break;
        case aKey:
            keyState[aKey] = on;
            break;
        case dKey:
            keyState[dKey] = on;
            break;
    }
});
window.addEventListener('keyup', function(event)
{
    switch (event.keyCode)
    {
        case wKey:
            keyState[wKey] = off;
            break;
        case sKey:
            keyState[sKey] = off;
            break;
        case aKey:
            keyState[aKey] = off;
            break;
        case dKey:
            keyState[dKey] = off;
            break;
    }
});

// main();
export function simpleTerrain()
{
    const canvas = document.querySelector("#webGLCanvas");
    const context = canvas.getContext("webgl");

    if(!context)
    {
        alert("Unable to initialize WebGL.");
        return;
    }

    const gpuProgram = context.createProgram();
    compileShaderToProgram(context.VERTEX_SHADER, terrainVertex, context, gpuProgram);
    compileShaderToProgram(context.FRAGMENT_SHADER, terrainFrag, context, gpuProgram);
    context.linkProgram(gpuProgram);

    if (!context.getProgramParameter(gpuProgram, context.LINK_STATUS))
    {
        alert('Shader program can\'t initialize :(\n' + context.getProgramInfoLog(gpuProgram));
        return null;
    }

    const programData = {
        program: gpuProgram,
        attributeLocations: {
            edgeHandler: context.getAttribLocation(gpuProgram, 'edgeHandler')},
        uniformLocations: {
            playerPosition: context.getUniformLocation(gpuProgram, 'playerPosition'),
            rockTexture: context.getUniformLocation(gpuProgram, 'rockTexture'),
            lightPosition: context.getUniformLocation(gpuProgram, 'lightPos'),
            iTime: context.getUniformLocation(gpuProgram, 'iTime'),
            projectionMatrix: context.getUniformLocation(gpuProgram, 'projection'),
            viewMatrix: context.getUniformLocation(gpuProgram, 'view'),
            modelMatrix: context.getUniformLocation(gpuProgram, 'model')}
    };

    let planeDimensions = {width: 300, height: 400};
    const buffer = initVertexBuffers(context, programData, planeDimensions);
    const rockTexture = loadTexture(context, "rock256.jpg");

    context.useProgram(gpuProgram);

    context.activeTexture(context.TEXTURE0);
    context.bindTexture(context.TEXTURE_2D, rockTexture);
    context.uniform1i(programData.uniformLocations.rockTexture, 0);

    const uniforms = {projectionMatrix: mat4.create(), modelMatrix: mat4.create(), viewMatrix: mat4.create()};

    mat4.translate(uniforms.viewMatrix, uniforms.viewMatrix, [0.0, 75, 0.]);
    mat4.rotate(uniforms.viewMatrix, uniforms.viewMatrix, Math.PI*.25, [1,0,0]);
    mat4.rotate(uniforms.viewMatrix, uniforms.viewMatrix, -Math.PI, [0,1,0]);
    mat4.invert(uniforms.viewMatrix, uniforms.viewMatrix);

    mat4.perspective(uniforms.projectionMatrix, Math.PI*.5, (canvas.width / canvas.height), .1, 1000.);

    mat4.translate(uniforms.modelMatrix, uniforms.modelMatrix, [-planeDimensions.width*.5+50, 0., 400.]);
    mat4.rotate(uniforms.modelMatrix, uniforms.modelMatrix, -Math.PI*.5, [1,0,0]);

    context.uniform3fv(programData.uniformLocations.lightPosition, [150., 150., 500.]);
    context.uniformMatrix4fv(programData.uniformLocations.projectionMatrix, false, uniforms.projectionMatrix);
    context.uniformMatrix4fv(programData.uniformLocations.viewMatrix, false, uniforms.viewMatrix);
    context.uniformMatrix4fv(programData.uniformLocations.modelMatrix, false, uniforms.modelMatrix);

    context.clearColor(.4627,.6745,.8549, 1);

    function update(time)
    {
        draw(context, programData, buffer, canvas, time, uniforms);
        requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function buildPlane(width, height)
{
    const plane = [];

    for(let row = 0; row < height; row++)
    {
        for(let column = 0; column < width+1; column++)
        {
            if(row % 2 === 0)
                plane.push(column, row, column, row + 1);
            else
                plane.push(width-column, row, width-column, row+1)
        }
    }
    return plane;
}

function initVertexBuffers (context, programData, planeDimensions)
{
    const vertexBuffer = context.createBuffer();
    context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);

    const positions = buildPlane(planeDimensions.width, planeDimensions.height);

    context.bufferData(context.ARRAY_BUFFER, new Float32Array(positions), context.STATIC_DRAW);
    context.vertexAttribPointer(programData.attributeLocations.vertexPosition, 2, context.FLOAT, false, 0,0);
    context.enableVertexAttribArray(programData.attributeLocations.vertexPosition);

    return { size: positions.length };
}

function loadTexture(context, path)
{
    const texture = context.createTexture();
    context.bindTexture(context.TEXTURE_2D, texture);

    const placeHolderData = new Uint8Array([0]);
    context.texImage2D(context.TEXTURE_2D, 0, context.ALPHA, 1, 1, 0, context.ALPHA, context.UNSIGNED_BYTE, placeHolderData);

    const image = new Image();
    image.onload = function()
    {
        context.bindTexture(context.TEXTURE_2D, texture);
        context.texImage2D(context.TEXTURE_2D, 0, context.RGB, context.RGB, context.UNSIGNED_BYTE, image);
        context.generateMipmap(context.TEXTURE_2D);
    };
    image.src = path;
    return texture;
}

function compileShaderToProgram(type, source, context, program)
{
    const shader = context.createShader(type);
    context.shaderSource(shader, source);

    context.compileShader(shader);

    if (!context.getShaderParameter(shader, context.COMPILE_STATUS))
    {
        alert('One of the shaders failed to compile :(\n' + context.getShaderInfoLog(shader));
        context.deleteShader(shader);
        return null;
    }
    context.attachShader(program, shader);
}

let verticalState = 0, horizontalState = 0;
function draw(graphicsContext, shaderProgram, buffer, canvas, time)
{
    verticalState = keyState[wKey] - keyState[sKey];
    horizontalState = keyState[dKey] - keyState[aKey];

    playerPosition.x += horizontalState * 2;
    playerPosition.y += verticalState * 2;

    graphicsContext.clear(graphicsContext.COLOR_BUFFER_BIT);

    graphicsContext.uniform2fv(shaderProgram.uniformLocations.playerPosition, [playerPosition.x, playerPosition.y]);
    graphicsContext.uniform1f(shaderProgram.uniformLocations.iTime, time*.05);

    graphicsContext.drawArrays(graphicsContext.TRIANGLE_STRIP,0, buffer.size *.5);
}