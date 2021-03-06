var ctx, ctxNext;
var invalid = false;
var shape;
var gridPoints = [];
var nextType;
var shapeTypes = ['O','L','J','S','Z','I','T'];
var ShapeType = { 
	'O' : 'O',
	'L' : 'L',
	'T' : 'T',
	'J' : 'J',
	'S' : 'S',
	'Z' : 'Z',
	'I' : 'I'
};
var Direction = {
	'LEFT' : 'Left',
	'RIGHT' : 'right',
	'CW' : 'cw',
	'CCW' : 'ccw'
}
var ColourScheme = { 'STANDARD': 'Standard', 
            'DULL': 'Dull', 
            'BLACK': 'Black', 
            'RANDOM': 'Random'
};
var currentColourScheme = ColourScheme.STANDARD;
var blocksize = 30;
var gravitySpeed = 1000;
var gravityTimer;
var score = [0,40,100,300,1200];
var currentScore = 0;
var canHold;
var socket;

function initGame(human) {
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d');
	canvasNext = document.getElementById('next-preview');
	ctxNext = canvasNext.getContext('2d');
	ctxHold = document.getElementById('hold-preview').getContext('2d');

	setNext();
	createGrid();
	createShape();
	setInterval(draw, 100);
	resizePreview(ctxNext);
	resizePreview(ctxHold);
	if(human) {
		setGravity();
		new HumanInput();
		new HumanClient();
		$(".UserStatus").text("You are human.");
		$("#god-container").css({display:"none"});
		$("#canvas-container").css({display:"block"});
	} else {

		$(".UserStatus").text("You are God!");
		new GodClient();
		$("#canvas-container").css({display:"none"});
		$("#god-container").css({display:"block"});
	}

}

function createGrid() {
	gridPoints = new Array(10);
	var i;
	for(i = 0; i < 10; i++) {
		gridPoints[i] = new Array(22);
	}
	for(i = 0; i < 10; i++) {
		for(var j = 0; j < 22; j++) {
			gridPoints[i][j] = null;
		}
	}
}

function createShape() {
	shape = new Shape(nextType, currentColourScheme);
	for(j = 0; j<shape.points.length; j++) {
		shape.points[j].fill = shape.colour;
	}
	shape.move(Direction.RIGHT, shape.initialOffset);
	setNext();
	canHold = true;
}

function setGravity() {
	clearInterval(gravityTimer);
	gravityTimer = setInterval(gravity, gravitySpeed);
}

function setNext(type) {
	nextType = type ? type : (shapeTypes[Math.floor(Math.random() * shapeTypes.length)]);
	$('.type').text("Next Piece is: " + nextType);
	drawNextShape();
}

function drawNextShape() {
	var nextShape = new Shape(nextType, currentColourScheme);
	nextShape.previewAs(ctxNext);
}

function resizePreview(view) {
    view.clearRect(0,0,view.width,view.height);
    view.canvas.width = blocksize*4;
    view.canvas.height = blocksize*4;
}

function isGameOver() {
	for(var i=0; i<gridPoints.length; i++) {
		if(gridPoints[i][0] || gridPoints[i][1]) {
			return true;
		}
	}
	return false;
}

function gameOver() {
	console.log("game over");
	setTimeout(function() {	location.reload();},1000);
}

function checkMoving() {
	if(!shape) {return;}
	for(var j = 0; j<shape.points.length; j++) {
		x = shape.points[j].x;
		y = shape.points[j].y + 1;

		if(shape.points[j].y >=21 || gridPoints[x][y]) {
			for(var k = 0; k<shape.points.length; k++) {
				x = shape.points[k].x;
				y = shape.points[k].y;
				gridPoints[x][y] = shape.points[k];
			}
			shape = null;
			
			if(isGameOver()) {
				gameOver();
			} else {
				checkRow();
				createShape();
			}
			return false;
		}
	}
	return true;
}

function checkRow() {
	var linesCleared = 0;
	for(var i=0; i<gridPoints[0].length; i++) {
		//check if row is complete and should be removed
		var complete = true;
		var completeY;
		for(var j=0; j<gridPoints.length; j++) {
			if(!gridPoints[j][i]) {
				complete = false;
				completeY = i;
			}
		}

		if(complete) {
			//remove row points by making them null
			for(var k=0; k<gridPoints.length; k++) {
				gridPoints[k][i] = null;
			}
			//shift down all rows above deleted row
			for(var l=0; l<gridPoints.length; l++) {
				for(var m=completeY; m>=0; m--) {
					var point = gridPoints[l][m];
					if(point) {
						point.y +=1;
						gridPoints[l][m+1] = point;
						gridPoints[l][m] = null;
					}
				}
			}
			invalid = true;
			linesCleared++;
			draw();
			i--;
		}
	}
	increaseScore(linesCleared);
}

function increaseScore(linesCleared){
	currentScore += score[linesCleared];
	$("#score").text("Score: " + currentScore);
}

function gravity() {
	if(shape) {
		if(!checkMoving()) { return; }
		shape.gravity();
	}
	invalid = true;
	return shape ? true : false;
}

function recursiveGravity() {
	if(gravity()){
		recursiveGravity();
	}
}

$(window).resize(function() {
    ctxNext.clearRect(0,0,ctxNext.width,ctxNext.height);
    ctxNext.canvas.width = blocksize*4;
    ctxNext.canvas.height = blocksize*4;
    ctxHold.clearRect(0,0,ctxNext.width,ctxNext.height);
    ctxHold.canvas.width = blocksize*4;
    ctxHold.canvas.height = blocksize*4;

    invalid = true;
    draw();
});

function draw() {
	if(invalid) {
		drawNextShape();
		width = window.innerWidth;
		height = window.innerHeight - 200;
		width = height/2;

		ctx.canvas.width  = width;
		ctx.canvas.height = height;

		blocksize = ctx.canvas.width/10;

		ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);

		if(shape) {
			shape.draw();
		}
		for(var i = 0; i < 10; i++) {
			for(var j = 0; j < 22; j++) {
				if(gridPoints[i][j]) {
					gridPoints[i][j].draw();
				}
			}
		}
		invalid = false;
	}
}

var inHold;
function hold(){
	var currentNext;
	if(canHold){
		if(inHold){
			currentNext = nextType;
			nextType = inHold.type;
		}
		inHold = new Shape(shape.type);
		drawHold();
		createShape();
		setNext(currentNext);
		canHold = false;
	}
}

function drawHold(){
	if(inHold){
		inHold.previewAs(ctxHold);
	}
}