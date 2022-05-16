const can = document.getElementById('can');
const ctx = can.getContext('2d');

const can_w = can.width;// = 640;
const can_h = can.height;// = 480;

var intarvalID = null;

const block = new Array();

//let img_w;
const Coords = new coords3();

const Polygons = {
	polys : new Array(),

	addPolygon : function(poly){
		this.polys.push(poly);
		return this.polys.length - 1;
	},

	update : function(p){
		this.polys[p].update();
	},

	updateAll : function(){
		for(const poly of this.polys){
			poly.update();
		}
	}
};

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function keyEvent(e){
	let ray = camera.getRay();
	let top = camera.getTop();
	let right = camera.getRight();
	switch(e.key){
		case 'w':
			camera.move(
				0.5 * ray.x,
				0.5 * ray.y,
				0.5 * ray.z
			);
			break;
		case 's':
			camera.move(
				-0.5 * ray.x,
				-0.5 * ray.y,
				-0.5 * ray.z
			);
			break;
		case 'd':
			camera.move(
				0.5 * right.x,
				0.5 * right.y,
				0.5 * right.z
			);
			break;
		case 'a':
			camera.move(
				-0.5 * right.x,
				-0.5 * right.y,
				-0.5 * right.z
			);
			break;
		case 'q':
			camera.move(
				0.5 * top.x,
				0.5 * top.y,
				0.5 * top.z
			);
			break;
		case 'e':
			camera.move(
				-0.5 * top.x,
				-0.5 * top.y,
				-0.5 * top.z
			);
			break;
		case 'r':
			camera.rotateRight(-0.1);
			break;
		case 'f':
			camera.rotateRight(0.1);
			break;
		case 'c':
			camera.rotateTop(0.1);
			break;
		case 'z':
			camera.rotateTop(-0.1);
			break;

		case 'i':
			for(b of block){
				b.rotateX(0.1);
			}
			break;
		case 'k':
			for(b of block){
				b.rotateX(-0.1);
			}
			break;
		case 'u':
			for(b of block){
				b.rotateZ(0.1);
			}
			break;
		case 'o':
			for(b of block){
				b.rotateZ(-0.1);
			}
			break;
		case 'j':
			for(b of block){
				b.rotateY(0.1);
			}
			break;
		case 'l':
			for(b of block){
				b.rotateY(-0.1);
			}
			break;
		default: break;
	}
	draw(can_w, can_h);
}

function randomRotateObject(){
	let dx = Math.random() * 0.05;
	let dy = Math.random() * 0.05;
	let dz = Math.random() * 0.05;

	//for(b of block){
	//let b = block[1];
	//b.rotateX(-0.03);
	//b.rotateY(-0.02);
	//}

	const start = performance.now();
	draw(can_w, can_h);
	const end = performance.now();

	LineGraph.addData(end - start);
	LineGraph.draw();
}

function loop(){
	camera.set(0, 3, -10);
/*	let top = camera.getTop();
	let right = camera.getRight();
	camera.move(
		3 * top.x + 3 * right.x,
		3 * top.y + 3 * right.y,
		3 * top.z + 3 * right.z
	);

	camera.rotateTop(-0.2);
	camera.rotateRight(0.3);*/

	if(intarvalID != null) stop();
	intarvalID = setInterval(randomRotateObject, 16);
}

function stop(){
	clearInterval(intarvalID);
	intarvalID = null;
}

function testExtendY(d){
	let b = block[1];
	for(const point of b.coords){
		Coord.z[point] *= d;
	}
	for(const poly of b.polys){
		poly.update();
	}

	draw(can_w, can_h);
}

function createCubeObject(x, y, z){
	const _block = new blocks();

	_block.set(x, y, z);

	const pnt1 = Coords.addCoord(-1, -1, -1);
	const pnt2 = Coords.addCoord( 1, -1, -1);
	const pnt3 = Coords.addCoord( 1,  1, -1);
	const pnt4 = Coords.addCoord(-1,  1, -1);
	const pnt5 = Coords.addCoord(-1, -1,  1);
	const pnt6 = Coords.addCoord( 1, -1,  1);
	const pnt7 = Coords.addCoord( 1,  1,  1);
	const pnt8 = Coords.addCoord(-1,  1,  1);

	_block.addCoord(pnt1).addCoord(pnt2).addCoord(pnt3).addCoord(pnt4)
			.addCoord(pnt5).addCoord(pnt6).addCoord(pnt7).addCoord(pnt8);

	const poly1 = Polygons.addPolygon(Polygon.templateRect(pnt1, pnt4, pnt3, getRandomInt(0xff505050, 0xffffffff)));
	//const poly2 = Polygons.addPolygon(Polygon.templateTri(pnt1, pnt3, pnt2, getRandomInt(0xff505050, 0xffffffff)));
	const poly3 = Polygons.addPolygon(Polygon.templateTri(pnt4, pnt8, pnt7, getRandomInt(0xff505050, 0xffffffff)));
	const poly4 = Polygons.addPolygon(Polygon.templateTri(pnt4, pnt7, pnt3, getRandomInt(0xff505050, 0xffffffff)));
	const poly5 = Polygons.addPolygon(Polygon.templateTri(pnt2, pnt3, pnt7, getRandomInt(0xff505050, 0xffffffff)));
	const poly6 = Polygons.addPolygon(Polygon.templateTri(pnt2, pnt7, pnt6, getRandomInt(0xff505050, 0xffffffff)));
	const poly7 = Polygons.addPolygon(Polygon.templateTri(pnt5, pnt1, pnt2, getRandomInt(0xff505050, 0xffffffff)));
	const poly8 = Polygons.addPolygon(Polygon.templateTri(pnt5, pnt2, pnt6, getRandomInt(0xff505050, 0xffffffff)));
	const poly9 = Polygons.addPolygon(Polygon.templateTri(pnt5, pnt8, pnt4, getRandomInt(0xff505050, 0xffffffff)));
	const poly10 = Polygons.addPolygon(Polygon.templateTri(pnt5, pnt4, pnt1, getRandomInt(0xff505050, 0xffffffff)));
	const poly11 = Polygons.addPolygon(Polygon.templateTri(pnt6, pnt7, pnt8, getRandomInt(0xff505050, 0xffffffff)));
	const poly12 = Polygons.addPolygon(Polygon.templateTri(pnt6, pnt8, pnt5, getRandomInt(0xff505050, 0xffffffff)));

	_block.addPoly(poly1)
			//.addPoly(poly2)
			.addPoly(poly3).addPoly(poly4)
			.addPoly(poly5).addPoly(poly6).addPoly(poly7).addPoly(poly8)
			.addPoly(poly9).addPoly(poly10).addPoly(poly11).addPoly(poly12);

	block.push(_block);
}

function initCanvas(){
	ctx.clearRect(0, 0, can_w, can_h);

	ctx.strokeStyle = 'black';
	ctx.fillRect(0, 0, can_w, can_h);
}

function initObject(){
	const _block = new blocks();

	_block.set(0, -3, 0);

	const pnt1 = Coords.addCoord( 0, 0, 0);
	const pnt2 = Coords.addCoord( 0, 0, 1);
	const pnt3 = Coords.addCoord( 1, 0, 1);

	const poly1 = Polygons.addPolygon(new Polygon('field', 'normal', 'both', pnt1, pnt2, pnt3, 0xffffffff));

	_block.addCoord(pnt1)
			.addCoord(pnt2)
			.addCoord(pnt3)
			.addPoly(poly1);

	block.push(_block);


	createCubeObject(0, 0, 0);
	//createCubeObject(-4, 0, 0);

	/*createCubeObject(-8, 0, 0);
	createCubeObject(0, 0, 4);
	createCubeObject(0, 0, 8);*/
}

function initAll(){
	camera = new Camera(45, can_w / can_h, 1, Infinity);

	initCanvas();
	initObject();

	draw(can_w, can_h);

	document.addEventListener('keydown', function(e){keyEvent(e);});
}

initAll();
loop();