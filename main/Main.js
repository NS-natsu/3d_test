const can = document.getElementById('can');
const ctx = can.getContext('2d');

const can_w = can.width;// = 640;
const can_h = can.height;// = 480;

const FOV_W = 1.4;
const FOV_H = 0.8;
const Coords = new coords();
let block = new Array();

let pixels;
let img_w;
function draw(){
	ctx.clearRect(0, 0, can_w, can_h);

	ctx.strokeStyle = 'black';
	ctx.fillRect(0, 0, can_w, can_h);
	let imageData = ctx.getImageData(0, 0, can_w, can_h);
	let imageDataBuff = new Array(can_w*can_h);
	img_w = imageData.width;
	pixels = imageData.data;

	const resolution = 200;

	const pX = player.pos.x;
	const pY = player.pos.y;
	const pZ = player.pos.z;

	const pRay = player.ray;
	const pRight = player.right;
	const top = player.getTop();

	let ray = new vector3(0, 0, 0);
	let d = new vector3(0, 0, 0);

	const argRayW = Math.tan(FOV_W / 2);
	const argRayH = Math.tan(FOV_H / 2);

	const correctW = can_w / FOV_W;
	const correctH = can_h / FOV_H;

	for(const b of block){
		for(const polyNum of b.polys){
			const poly = Polygons.polys[polyNum];
			if(poly.type === 'field') continue;
			const base = poly.getBase();
			d.moveto(
				pX - Coords.x[b.offset] - base.x,
				pY - Coords.y[b.offset] - base.y,
				pZ - Coords.z[b.offset] - base.z
			);

			//if(detMat_fast(poly.line1.x , poly.line1.y, poly.line1.z,
			//	poly.line2.x, poly.line2.y, poly.line2.z,
			//	d.x, d.y, d.z) <= 0){
			const args = innerproduct(d, poly.normal);

			if(args === 0){
				continue;
			}

			if(poly.maskSide != 'both' && args < 0){
				continue;
			}

			for(let u = resolution; 0 <= u; u--){
				let v = resolution;
				if(poly.type === 'tri'){
					v -= u;
				}
				for(; 0 <= v; v--){
					const _u = u / resolution;
					const _v = v / resolution;

					let intersects = {
						dist: 0,
						dst_l1: _u,
						dst_l2: _v,
						pos: null,
						poly: null
					};

					ray.moveto(
						Coords.x[b.offset] + base.x + _u * poly.line1.x + _v * poly.line2.x - pX,
						Coords.y[b.offset] + base.y + _u * poly.line1.y + _v * poly.line2.y - pY,
						Coords.z[b.offset] + base.z + _u * poly.line1.z + _v * poly.line2.z - pZ
					).unitization();

					const correction = innerproduct(ray, pRay);
					if(correction < 0) continue;

					const argH = innerproduct(ray, top) / correction;
					if(((argH < 0) ? -argH : argH) > argRayH) continue;

					const argW = innerproduct(ray, pRight) / correction;
					if(((argW < 0) ? -argW : argW) > argRayW) continue;

					/*const det = detMat_fast(tri.line1.x , tri.line1.y, tri.line1.z,
									tri.line2.x, tri.line2.y, tri.line2.z,
									-ray.x, -ray.y, -ray.z);*/
					const det = -innerproduct(ray, poly.normal);

					/*const t = detMat_fast(
								tri.line1.x , tri.line1.y, tri.line1.z,
								tri.line2.x, tri.line2.y, tri.line2.z,
								d.x, d.y, d.z) / det;*/

					const t = args / det;
					if(t <= 0) continue;

					const diffW = (Math.atan(argW) + (FOV_W / 2)) * correctW;// + 0.5; いらなかった
					const diffH = ((FOV_H / 2) - Math.atan(argH)) * correctH;// + 0.5;

					const pnt = (diffH >> 0) * can_w + (diffW >> 0); // num | 0 == floor(num)
					if(imageDataBuff[pnt] === undefined || t <= imageDataBuff[pnt].dist){
						intersects.dist = t;
						intersects.poly = poly;
						intersects.pos = new vector3(
							pX + t * ray.x,
							pY + t * ray.y,
							pZ + t * ray.z
						);
						imageDataBuff[pnt] = intersects;
						//imageDataBuff[pnt] = {
						//	dist: t,
						//	dst_l1: _u,
						//	dst_l2: _v,
						//	pos: new vector3(
						//			player.pos.x + t * ray.x,
						//			player.pos.y + t * ray.y,
						//			player.pos.z + t * ray.z
						//		),
						//	tri: tri
						//};
					}
				}
			}
		}
	}

	rayTracing_field(imageDataBuff);

	setDrawData(imageDataBuff);

	ctx.putImageData(imageData, 0, 0);
}

function keyEvent(e){
	let top = player.getTop();
	switch(e.key){
		case 'w':
			const ray = player.getRay();
			player.move(0.5 * ray.x, 0.5 * ray.y, 0.5 * ray.z);
			break;
		case 's':
			const ray = player.getRay();
			player.move(-0.5 * ray.x, -0.5 * ray.y, -0.5 * ray.z);
			break;
		case 'd':
			const right = player.getRight();
			player.move(0.5 * right.x, 0.5 * right.y, 0.5 * right.z);
			break;
		case 'a':
			const right = player.getRight();
			player.move(-0.5 * right.x, -0.5 * right.y, -0.5 * right.z);
			break;
		case 'q':
			const top = player.getTop();
			player.move(0.5 * top.x, 0.5 * top.y, 0.5 * top.z);
			break;
		case 'e':
			const top = player.getTop();
			player.move(-0.5 * top.x, -0.5 * top.y, -0.5 * top.z);
			break;

		case 'r':
			player.rotateRight(-0.1);
			break;
		case 'f':
			player.rotateRight(0.1);
			break;
		case 'c':
			player.rotateTop(0.1);
			break;
		case 'z':
			player.rotateTop(-0.1);
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
	draw();
}

document.addEventListener('keydown', function(e){keyEvent(e);});

function randomRotateObject(){
	let dx = Math.random() * 0.05;
	let dy = Math.random() * 0.05;
	let dz = Math.random() * 0.05;

	//for(b of block){
	let b = block[1];
	b.rotateX(-0.03);
	b.rotateY(-0.02);
	//}

	const start = performance.now();
	draw();
	const end = performance.now();

	LineGraph.addData(end - start);
	LineGraph.draw();

}

var intarvalID = null;
function loop(){
	player.set(0, 0, -10);
	let right = player.getRight();
	let top = player.getTop();
	player.move(
		3 * top.x + 3 * right.x,
		3 * top.y + 3 * right.y,
		3 * top.z + 3 * right.z
	);

	player.rotateTop(-0.2);

	player.rotateRight(0.3);

	draw();

	if(intarvalID != null) stop();
	intarvalID = setInterval(randomRotateObject, 16);
}

function stop(){
	clearInterval(intarvalID);
	intarvalID = null;
}

initCanvas();
draw();

loop();

function testExtendY(d){
	let b = block[0];
	for(point of b.points){
		point.y *= d;
	}
	for(tri of b.tris){
		tri.update();
	}

	draw();
}



function initCanvas(){
	ctx.clearRect(0, 0, can_w, can_h);

	ctx.strokeStyle = 'black';
	ctx.fillRect(0, 0, can_w, can_h);


	player = new Camera(45, can_w / can_h, 1, infinity);

	initObject();

	/*initObject(-8, 0, 0);

	initObject(0, 0, 4);

	initObject(0, 0, 8);*/

}

function initObject(x, y, z){
	const _block = new blocks();

	_block.set(0, -3, 0);

	const pnt1 = Coords.addCoord( 0, 0, 0);
	const pnt2 = Coords.addCoord( 1, 0, 0);
	const pnt3 = Coords.addCoord( 1, 0, 1);

	const poly1 = Polygons.addPolygon(new Polygon('field', 'normal', 'both', pnt1, pnt2, pnt3, 0xffffffff));

	_block.addCoord(pnt1)
			.addCoord(pnt2)
			.addCoord(pnt3)
			.addPoly(poly1);

	block.push(_block);


	createCubeObject(0, 0, 0);
	createCubeObject(-4, 0, 0);

	/*createCubeObject(-8, 0, 0);
	createCubeObject(0, 0, 4);
	createCubeObject(0, 0, 8);*/
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

	_block.addCoord(pnt1)
			.addCoord(pnt2)
			.addCoord(pnt3)
			.addCoord(pnt4)
			.addCoord(pnt5)
			.addCoord(pnt6)
			.addCoord(pnt7)
			.addCoord(pnt8);

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
			.addPoly(poly3)
			.addPoly(poly4)
			.addPoly(poly5)
			.addPoly(poly6)
			.addPoly(poly7)
			.addPoly(poly8)
			.addPoly(poly9)
			.addPoly(poly10)
			.addPoly(poly11)
			.addPoly(poly12);

	block.push(_block);
}
