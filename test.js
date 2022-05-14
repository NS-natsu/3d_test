const can = document.getElementById('can');
const ctx = can.getContext('2d');

const can_w = can.width;// = 640;
const can_h = can.height;// = 480;

const FOV_W = 1.4;
const FOV_H = 0.8;

class vectors{
	constructor(){
		this.x = new Float64Array();
		this.y = new Float64Array();
		this.z = new Float64Array();
	}
	addVector(x, y, z){
		const len = this.x.length;
		let tmp = new Float64Array(len + 1);
		tmp.set(this.x, 0);
		tmp[len] = x;
		this.x = tmp;

		tmp = new Float64Array(len + 1);
		tmp.set(this.y, 0);
		tmp[len] = y;
		this.y = tmp;

		tmp = new Float64Array(len + 1);
		tmp.set(this.z, 0);
		tmp[len] = z;
		this.z = tmp;

		return len;
	}

	getCoords(n){
		return {
			x : this.x[n],
			y : this.y[n],
			z : this.z[n]
		};
	}

	getVector(n){
		return new vector3(this.x[n], this.y[n], this.z[n]);
	}
}

class Polygon{
	constructor(type, surface, side, p0, p1, p2, col){
		this.type = type;
		//if(type != 'triangle' && type != 'Rect' && type != 'field'){
			this. type = 'tri';
		//}

		this.surface = surface;
		
		//if(surface != 'normal' && surface != 'mirror' && surface != 0){
			this.surface = 'normal';
		//}

		this.maskSide = side;
		//if(this.maskSide != 'one' && this.maskSide != 'both'){
			this.maskSide = 'one'
		//}

		this.p = [p0, p1, p2];

		this.col = col;

		this.line1 = vector3.subVector(Coords.getVector(p1), Coords.getCoords(p0));
		this.line2 = vector3.subVector(Coords.getVector(p2), Coords.getCoords(p0));

		this.normal = crossproduct(this.line1, this.line2);
	}

	update(){
		this.line1 = vector3.subVector(Coords.getVector(this.p[1]), Coords.getCoords(this.p[0]));
		this.line2 = vector3.subVector(Coords.getVector(this.p[2]), Coords.getCoords(this.p[0]));

		this.normal = crossproduct(this.line1, this.line2);
	}

	getline(a, b){
		let line = new vector3(
			this.p[b].x - this.p[a].x,
			this.p[b].y - this.p[a].y,
			this.p[b].z - this.p[a].z
		);
		return line;
	}

	static templateTri(p0, p1, p2, col){
		return new Polygon('tri', 'normal', 'one', p0, p1, p2, col);
	}
}

const Coords = new vectors();
const Polygons = {
	polys : new Array(),

	addPolygon : function(poly){
		this.polys.push(poly);
		return this.polys.length - 1;
	},

	update : function(p){
		this.polys[p].update();
	}
}

class vector2 {
	constructor(x, y){ 
		this.x = x;
		this.y = y;
	}
	static createVec(x, y){
		let vec = new vector2(x, y);
		return vec;
	}
}

class vector3 {
	constructor(_x, _y, _z){
		this.x = _x;
		this.y = _y;
		this.z = _z;

		return this;
	}
	moveto(x, y, z){
		this.x = x;
		this.y = y;
		this.z = z;
		return this;
	}
	getSize(){
		return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
	}
	unitization(){
		const size = 1.0 / this.getSize();
		this.x *= size;
		this.y *= size;
		this.z *= size;
		return this;
	}
	clone(){
		let vec = new vector3(this.x, this.y, this.z);
		return vec;
	}
	multipryScalar(k){
		this.x *= k;
		this.y *= k;
		this.z *= k;
		return this;
	}

	rotateX(theta){
		const x = this.x;
		const y = this.y * Math.cos(theta) - this.z * Math.sin(theta);
		const z = this.y * Math.sin(theta) + this.z * Math.cos(theta);

		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	rotateY(theta){
		const x = this.x * Math.cos(theta) + this.z * Math.sin(theta);
		const y = this.y;
		const z = -this.x * Math.sin(theta) + this.z * Math.cos(theta);

		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	rotateZ(theta){
		const x = this.x * Math.cos(theta) - this.y * Math.sin(theta);
		const y = this.x * Math.sin(theta) + this.y * Math.cos(theta);
		const z = this.z;

		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	rotateVec(n, theta){
		const m = [
			[n.x * n.x * (1 - Math.cos(theta)) + Math.cos(theta), n.x * n.y * (1 - Math.cos(theta)) - n.z * Math.sin(theta), n.x * n.z * (1 - Math.cos(theta)) + n.y * Math.sin(theta) ],
			[n.x * n.y * (1 - Math.cos(theta)) + n.z * Math.sin(theta), n.y * n.y * (1 - Math.cos(theta)) + Math.cos(theta), n.y * n.z * (1 - Math.cos(theta)) - n.x * Math.sin(theta) ],
			[n.x * n.z * (1 - Math.cos(theta)) - n.y * Math.sin(theta), n.y * n.z * (1 - Math.cos(theta)) + n.x * Math.sin(theta), n.z * n.z * (1 - Math.cos(theta)) + Math.cos(theta) ]
		];
		const x = this.x * m[0][0] + this.y * m[0][1] + this.z * m[0][2];
		const y = this.x * m[1][0] + this.y * m[1][1] + this.z * m[1][2];
		const z = this.x * m[2][0] + this.y * m[2][1] + this.z * m[2][2];


		this.x = x;
		this.y = y;
		this.z = z;

		return this;
	}

	static createUnit(x, y, z){
		const r = Math.sqrt(x * x + y * y + z * z);
		let vec = new vector3(x / r, y / r , z / r);
		return vec;
	}

	static subVector(vecA, vecB){
		let ret = vecA.clone();
		ret.x -= vecB.x;
		ret.y -= vecB.y;
		ret.z -= vecB.z;
		return ret;
	}
}

class blocks {
	constructor(){
		this.offset = Coords.addVector(0, 0, 0);
		this.coords = new Array();
		this.polys = new Array();
	}
	move(x, y, z){
		Coords.x[this.offset] += x;
		Coords.y[this.offset] += y;
		Coords.z[this.offset] += z;
	}
	set(x, y, z){
		Coords.x[this.offset] = x;
		Coords.y[this.offset] = y;
		Coords.z[this.offset] = z;
	}
	addCoord(coord){
		this.coords.push(coord);
		return this;
	}
	addPoly(poly){
		this.polys.push(poly);
		return this;
	}

	rotateX(theta){
		const vec = new vector3(0, 0, 0);
		for(const c of this.coords){
			vec.moveto(Coords.x[c], Coords.y[c], Coords.z[c]);
			vec.rotateX(theta);
			Coords.x[c] = vec.x;
			Coords.y[c] = vec.y;
			Coords.z[c] = vec.z;
		}
		for(const poly of this.polys){
			Polygons.update(poly);
		}
	}
	rotateY(theta){
		const vec = new vector3(0, 0, 0);
		for(const c of this.coords){
			vec.moveto(Coords.x[c], Coords.y[c], Coords.z[c]);
			vec.rotateY(theta);
			Coords.x[c] = vec.x;
			Coords.y[c] = vec.y;
			Coords.z[c] = vec.z;
		}
		for(const poly of this.polys){
			Polygons.update(poly);
		}
	}
	rotateZ(theta){
		const vec = new vector3(0, 0, 0);
		for(const c of this.coords){
			vec.moveto(Coords.x[c], Coords.y[c], Coords.z[c]);
			vec.rotateZ(theta);
			Coords.x[c] = vec.x;
			Coords.y[c] = vec.y;
			Coords.z[c] = vec.z;
		}
		for(const poly of this.polys){
			Polygons.update(poly);		}
	}
	rotateVec(n, theta){
		const vec = new vector3(0, 0, 0);
		for(const c of this.coords){
			vec.moveto(Coords.x[c], Coords.y[c], Coords.z[c]);
			vec.rotateX(n, theta);
			Coords.x[c] = vec.x;
			Coords.y[c] = vec.y;
			Coords.z[c] = vec.z;
		}
		for(const poly of this.polys){
			Polygons.update(poly);
		}
	}
}

function innerproduct(a, b){
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function crossproduct(a, b){
	let normal = new vector3(
		-1 * (a.y * b.z - a.z * b.y),
		-1 * (a.z * b.x - a.x * b.z),
		-1 * (a.x * b.y - a.y * b.x)
	);
	return normal;
}

function detMat(a, b, c){
	return	 ((a.x * b.y * c.z)
			+ (a.y * b.z * c.x)
			+ (a.z * b.x * c.y)
			- (a.x * b.z * c.y)
			- (a.y * b.x * c.z)
			- (a.z * b.y * c.x));
}

function detMat_fast(ax, ay, az, bx, by, bz, cx, cy, cz){
	const a = ax * by * cz;
	const b = ay * bz * cx;
	const c = az * bx * cy;
	const abc = a + b + c;
	const d = ax * bz * cy;
	const e = ay * bx * cz;
	const f = az * by * cx;
	const def = d + e + f;
	return abc - def;
}

function getRandomInt(min, max){
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min)) + min;
}

function initCanvas(){
	ctx.clearRect(0, 0, can_w, can_h);

	ctx.strokeStyle = 'black';
	ctx.fillRect(0, 0, can_w, can_h);


	player = new Player(
		new vector3(0, 0, -10),
		new vector3(0, 0, 1),
		new vector3(1, 0, 0)
	);

	initObject(0, 0, 0);

	initObject(-4, 0, 0);

	/*initObject(-8, 0, 0);

	initObject(0, 0, 4);

	initObject(0, 0, 8);*/

}

let player;
class Player{
	constructor(pos, ray, right){
		this.pos = pos;
		this.ray = ray;
		this.right = right;
	}
}

let block = new Array();

let pixels;
let img_w;

function viewPoint(x, y, data){
	const base = (y * img_w + x) * 4;

	/*pixels[base + 0] = (poly.tri.col >>> 16) & 0xff;
	pixels[base + 1] = (poly.tri.col >>> 8) & 0xff;
	pixels[base + 2] = poly.tri.col & 0xff;
	pixels[base + 3] = (poly.tri.col >>> 24) & 0xff;
	return;*/

	//光源からの方向
	const light = new vector3(3, 10, -5);
	const ambient = 20;
	let diffuse;
	let normal = data.poly.normal.clone().unitization();

	let point = new vector3(
		data.pos.x - light.x,
		data.pos.y - light.y,
		data.pos.z - light.z
	);

	point.unitization();

	diffuse = innerproduct(point, normal) * (100 - ambient);

	if(diffuse < 0) diffuse = 0;

	//鏡面光 とりあえず視線が完全に反射すると仮定して反射したベクトルが光源に向かうかを調べる
	let ray = new vector3(
		data.pos.x - player.pos.x,
		data.pos.y - player.pos.y,
		data.pos.z - player.pos.z
	);

	let n = innerproduct(normal, ray) * 2;

	ray.x -= n * normal.x;
	ray.y -= n * normal.y;
	ray.z -= n * normal.z;

	ray.unitization();

	let specular = -innerproduct(ray, point);

	pixels[base + 0] = (data.poly.col >>> 16) & 0xff;
	pixels[base + 1] = (data.poly.col >>> 8) & 0xff;
	pixels[base + 2] = data.poly.col & 0xff;
	pixels[base + 3] = (data.poly.col >>> 24) & 0xff;

	pixels[base + 0] *= (ambient + diffuse) / 100;
	pixels[base + 1] *= (ambient + diffuse) / 100;
	pixels[base + 2] *= (ambient + diffuse) / 100;

	const threshold = Math.cos((3 * 2 * Math.PI) / 360);
	if(threshold < specular) {
		specular = (specular - threshold) / (1 - threshold);
		let strong = pixels[base + 0] + 255 * specular * specular;
		pixels[base + 0] = (255 < strong) ? 255 : strong;

		strong = pixels[base + 1] + 255 * specular * specular;
		pixels[base + 1] = (255 < strong) ? 255 : strong;
		
		strong = pixels[base + 2] + 255 * specular * specular;
		pixels[base + 2] = (255 < strong) ? 255 : strong;
	}
}

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
	const top = crossproduct(pRight, pRay).unitization();

	let ray = new vector3(0, 0, 0);
	let d = new vector3(0, 0, 0);

	const argRayW = Math.tan(FOV_W / 2);
	const argRayH = Math.tan(FOV_H / 2);

	const correctW = can_w / FOV_W;
	const correctH = can_h / FOV_H;

	for(const b of block){
		for(const polyNum of b.polys){
			const poly = Polygons.polys[polyNum];
			d.moveto(
				pX - Coords.x[b.offset] - Coords.x[poly.p[0]],
				pY - Coords.y[b.offset] - Coords.y[poly.p[0]],
				pZ - Coords.z[b.offset] - Coords.z[poly.p[0]]
			);

			//if(detMat_fast(poly.line1.x , poly.line1.y, poly.line1.z,
			//	poly.line2.x, poly.line2.y, poly.line2.z,
			//	d.x, d.y, d.z) <= 0){
			const args = -innerproduct(d, poly.normal);
			if(args <= 0){
				continue;
			}

			for(let u = 0; u <= resolution; u++){
				for(let v = 0; v <= resolution - u; v++){
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
						Coords.x[b.offset] + Coords.x[poly.p[0]] + _u * poly.line1.x + _v * poly.line2.x - pX,
						Coords.y[b.offset] + Coords.y[poly.p[0]] + _u * poly.line1.y + _v * poly.line2.y - pY,
						Coords.z[b.offset] + Coords.z[poly.p[0]] + _u * poly.line1.z + _v * poly.line2.z - pZ
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
					const det = innerproduct(ray, poly.normal);

					/*const t = detMat_fast(
								tri.line1.x , tri.line1.y, tri.line1.z,
								tri.line2.x, tri.line2.y, tri.line2.z,
								d.x, d.y, d.z) / det;*/

					const t = args / det;
					if(t <= 0) continue;

					const diffW = (Math.atan(argW) + (FOV_W / 2)) * correctW + 0.5;
					const diffH = ((FOV_H / 2) - Math.atan(argH)) * correctH + 0.5;

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

	for(let y = 0; y < can_h; y++){
		for(let x = 0; x < can_w; x++){
			let datum =  imageDataBuff[y * can_w + x];
			if(datum === undefined) continue;
			viewPoint(x, y, datum);
		}
	}

	ctx.putImageData(imageData, 0, 0);
}

function keyEvent(e){
	let top = crossproduct(player.right, player.ray);
	switch(e.key){
		case 'w':
			player.pos.x += 0.5 * player.ray.x;
			player.pos.y += 0.5 * player.ray.y;
			player.pos.z += 0.5 * player.ray.z;
			break;
		case 's':
			player.pos.x -= 0.5 * player.ray.x;
			player.pos.y -= 0.5 * player.ray.y;
			player.pos.z -= 0.5 * player.ray.z;
			break;
		case 'd':
			player.pos.x += 0.5 * player.right.x;
			player.pos.y += 0.5 * player.right.y;
			player.pos.z += 0.5 * player.right.z;
			break;
		case 'a':
			player.pos.x -= 0.5 * player.right.x;
			player.pos.y -= 0.5 * player.right.y;
			player.pos.z -= 0.5 * player.right.z;
			break;
		case 'q':
			player.pos.x += 0.5 * top.x;
			player.pos.y += 0.5 * top.y;
			player.pos.z += 0.5 * top.z;
			break;
		case 'e':
			player.pos.x -= 0.5 * top.x;
			player.pos.y -= 0.5 * top.y;
			player.pos.z -= 0.5 * top.z;
			break;
		case 'r':
			player.ray.rotateVec(player.right, -0.1);
			top.rotateVec(player.right, -0.1);
			break;
		case 'f':
			player.ray.rotateVec(player.right, 0.1);
			top.rotateVec(player.right, 0.1);
			break;
		case 'c':
			player.ray.rotateVec(top, 0.1);
			player.right.rotateVec(top, 0.1);
			break;
		case 'z':
			player.ray.rotateVec(top, -0.1);
			player.right.rotateVec(top, -0.1);
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
	let b = block[0];
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
	
	player.ray.moveto(0, 0, 1);
	player.right.moveto(1, 0, 0);
	player.pos.moveto(0, 0, -10);
	let top = crossproduct(player.right, player.ray);
	player.pos.x += 3 * top.x + 3 * player.right.x;
	player.pos.y += 3 * top.y + 3 * player.right.y;
	player.pos.z += 3 * top.z + 3 * player.right.z;

	player.ray.rotateVec(top, -0.2);
	player.right.rotateVec(top, -0.2);

	player.ray.rotateVec(player.right, 0.3);
	top.rotateVec(player.right, 0.3);

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

//loop();

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

function initObject(x, y, z){
	const _block = new blocks();

	_block.set(x, y, z);

	const pnt1 = Coords.addVector(-1, -1, -1);
	const pnt2 = Coords.addVector( 1, -1, -1);
	const pnt3 = Coords.addVector( 1,  1, -1);
	const pnt4 = Coords.addVector(-1,  1, -1);
	const pnt5 = Coords.addVector(-1, -1,  1);
	const pnt6 = Coords.addVector( 1, -1,  1);
	const pnt7 = Coords.addVector( 1,  1,  1);
	const pnt8 = Coords.addVector(-1,  1,  1);

	_block.addCoord(pnt1)
			.addCoord(pnt2)
			.addCoord(pnt3)
			.addCoord(pnt4)
			.addCoord(pnt5)
			.addCoord(pnt6)
			.addCoord(pnt7)
			.addCoord(pnt8);

	const poly1 = Polygons.addPolygon(Polygon.templateTri(pnt1, pnt4, pnt3, getRandomInt(0xff505050, 0xffffffff)));
	const poly2 = Polygons.addPolygon(Polygon.templateTri(pnt1, pnt3, pnt2, getRandomInt(0xff505050, 0xffffffff)));
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
			.addPoly(poly2)
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