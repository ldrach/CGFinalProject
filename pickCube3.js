"use strict";

var elt;
var canvas;
var gl;
var time = 0;
var level = 1;
var target = " ";
var score = 0;
var numPositions  = 36;
var toggleCount = 0;
var positionsArray = [];
var normalsArray = [];
var colorsArray = [];
var texSize = 64;

var framebuffer;

var flag = false;

var color = new Uint8Array(4);

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
    for ( var j = 0; j < texSize; j++)
        image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        for(var k =0; k<4; k++)
            image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];

var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

function configureTexture(image) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
        gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0),
    ];

var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0),   // white
    ];


var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4( .0, 1.0, 1.0, 1.0);

//var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
//var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialDiffuse = vec4(0.5, 0.5, 0.5, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 10.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelViewMatrix, projectionMatrix;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;

var theta = vec3(45.0, 45.0, 45.0);

var thetaLoc;


init();


function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     normal = normalize(normal);

     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[0]);
     positionsArray.push(vertices[b]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[1]);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]);
     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[0]);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[2]);
     positionsArray.push(vertices[d]);
     normalsArray.push(normal);
     colorsArray.push(vertexColors[a]);
     texCoordsArray.push(texCoord[3]);
}


function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function getNextTarget(){
    var rand = Math.floor(Math.random() * 100);
    var value=" ";
    if(rand%6==0){
        document.getElementById("targetColor").innerHTML = "Cyan";
        value="Cyan";
    }
    else if(rand%6==1){
        document.getElementById("targetColor").innerHTML = "Red";
        value="Red";
    }
    else if(rand%6==2){
        document.getElementById("targetColor").innerHTML = "Magenta";
        value="Magenta";
    }
    else if(rand%6==3){
        document.getElementById("targetColor").innerHTML = "Yellow";
        value="Yellow";
    }
    else if(rand%6==4){
        document.getElementById("targetColor").innerHTML = "Blue";
        value="Blue";
    }
    else if(rand%6==5){
        document.getElementById("targetColor").innerHTML = "Green";
        value="Green";
    }
    return value;
}


function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    elt = document.getElementById("selection");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1.0);

    gl.enable(gl.CULL_FACE);


    var texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0,
       gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.generateMipmap(gl.TEXTURE_2D);

// Allocate a frame buffer object

   framebuffer = gl.createFramebuffer();
   gl.bindFramebuffer( gl.FRAMEBUFFER, framebuffer);


// Attach color buffer

   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

// check for completeness

   //var status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
   //if(status != gl.FRAMEBUFFER_COMPLETE) alert('Frame Buffer Not Complete');

gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation( program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    configureTexture(image2);
    gl.uniform1i( gl.getUniformLocation(program, "uTextureMap"), 0);

    viewerPos = vec3(0.0, 0.0, -20.0);

    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


    document.getElementById("startButton").onclick = function(){
        flag = !flag;
        if(!flag) {
            xAxis = 0;
            yAxis = 1;
            zAxis = 2;
            axis = xAxis;
            score = 0;
            toggleCount = 0;
            level = 0;
            document.getElementById("score").innerHTML = score;
        }
        if(flag==true) {
            document.getElementById("startButton").innerHTML = 'Give Up?';
            target = getNextTarget();
            level = 1;
            score = 0;
            document.getElementById("score").innerHTML = score;
            document.getElementById("level").innerHTML=level;
            document.getElementById("gameHeader").innerHTML="Begin!";
        }
        else {
            document.getElementById("startButton").innerHTML = 'Start';
            document.getElementById("gameHeader").innerHTML="Press Start To Play!";
            level = 0;
            document.getElementById("level").innerHTML=level;
        }
        var rand = Math.floor(Math.random() * 100);
        if(rand%3==0) {
            axis = xAxis;
        }
        else if(rand%3==1) {
            axis = yAxis;
        }
        else if(rand%3==2) {
            axis = zAxis;
        }
    };

    document.getElementById("toggleRotation").onclick = function(){

        if(toggleCount%3==0) {
            axis = xAxis;
            toggleCount++;
        }
        else if(toggleCount%3==1) {
            axis = yAxis;
            toggleCount++;
        }
        else if(toggleCount%3==2) {
            axis = zAxis;
            toggleCount++;
        }
    };



    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
       lightPosition );

    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"),materialShininess);

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),
       false, flatten(projectionMatrix));


    canvas.addEventListener("mousedown", function(event){

        var choice = " ";
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.clear( gl.COLOR_BUFFER_BIT);
        gl.uniform3fv(thetaLoc, theta);
        for(var i=0; i<6; i++) {
            gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), i+1);
            gl.drawArrays( gl.TRIANGLES, 6*i, 6 );
        }
        var x = event.clientX;
        var y = canvas.height-event.clientY;

        gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, color);

        if(color[0]==255)

        if(color[1]==255) {
            elt.innerHTML = "<td> Cyan </td>";
            choice = "Cyan";
        }
        else if(color[2]==255) {
            elt.innerHTML = "<td> Magenta </td>";
            choice = "Magenta";
        }
        else {
            elt.innerHTML = "<td> Red </td>";
            choice = "Red";
        }
        else if(color[1]==255)

        if(color[2]==255) {
            elt.innerHTML = "<td> Blue </td>";
            choice = "Blue";
        }
        else {
            elt.innerHTML = "<td> Yellow </td>";
            choice = "Yellow";
        }
        else if(color[2]==255) {
            elt.innerHTML = "<td> Green </td>";
            choice = "Green";
        }
        else {
            elt.innerHTML = "<td> Miss </td>";
            choice = "Miss";
        }
        if(flag==true) {
            if (target == choice) {
                score++;
                document.getElementById("score").innerHTML = score;
                document.getElementById("gameHeader").innerHTML = "Correct!";
            } else {
                score = 0;
                level = 1;
                document.getElementById("level").innerHTML = level;
                document.getElementById("score").innerHTML = score;
                gl.clearColor(1, 1, 1, 1.0);
                document.getElementById("gameHeader").innerHTML = "Sorry, please try again! Careful of the Black Spaces!";
            }
        }

        if(score==3){
            score=0;
            document.getElementById("score").innerHTML = score;
            level++;
            if(level==6){
                flag = !flag;
                score=0;
                level=1;
                gl.clearColor(1, 1, 1, 1.0);
                document.getElementById("level").innerHTML=level;
                document.getElementById("score").innerHTML = score;
                document.getElementById("startButton").innerHTML = 'Start';
                document.getElementById("gameHeader").innerHTML="Congratulations! You Won! Thank you for playing!";
            }
            else if(level==2){
                gl.clearColor(1, 0, 0, 1.0);
            }
            else if(level==3){
                gl.clearColor(0, 1, 0, 1.0);
            }
            else if(level==4){
                gl.clearColor(0, 0, 1, 1.0);
            }
            else if(level==5){
                gl.clearColor(0, 0, 0, 1.0);
            }

            document.getElementById("level").innerHTML = level;
            document.getElementById("gameHeader").innerHTML = "Level Up!";

        }

        target = getNextTarget();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"), 0);
        gl.clear( gl.COLOR_BUFFER_BIT );
        gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    });

    render();
}

function render(){
    gl.clear( gl.COLOR_BUFFER_BIT );

    if(flag) {
        theta[axis] += level;
    }

    lightPosition[0] = 5.5*Math.sin(0.01*time);
    lightPosition[2] = 5.5*Math.cos(0.01*time);

    time += 1;

    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));

    gl.uniformMatrix4fv( gl.getUniformLocation(program,
            "uModelViewMatrix"), false, flatten(modelViewMatrix));
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
    var ambientProduct = mult(lightAmbient, materialAmbient);
    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"), ambientProduct);
    var specularProduct = mult(lightSpecular, materialSpecular);
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"), specularProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPosition);
    gl.uniform1f(gl.getUniformLocation(program, "uShininess"), materialShininess);

    gl.uniform1i(gl.getUniformLocation(program, "uColorIndex"),0);
    gl.drawArrays( gl.TRIANGLES, 0, numPositions );

    requestAnimationFrame(render);
}
