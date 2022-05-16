class Polygon{
	type;
	surface;
	maskSide;
	p;
	col;
	line1;
	line2;
	normal;
	constructor(type, surface, side, p0, p1, p2, col){
		this.type = type;
		if(type != 'triangle' && type != 'rect' && type != 'field'){
			this. type = 'tri';
		}

		this.surface = surface;
		
		if(surface != 'normal' && surface != 'mirror' && surface != 0){
			this.surface = 'normal';
		}

		this.maskSide = side;
		if(this.maskSide != 'one' && this.maskSide != 'both'){
			this.maskSide = 'one'
		}

		this.p = [p0, p1, p2];

		this.col = col;

		this.line1 = vector3.subVector(Coords.getVector(p2), Coords.getCoord(p1));
		this.line2 = vector3.subVector(Coords.getVector(p0), Coords.getCoord(p1));

		this.normal = crossproduct(this.line1, this.line2);
	}

	update(){
		this.line1 = vector3.subVector(Coords.getVector(this.p[2]), Coords.getCoord(this.p[1]));
		this.line2 = vector3.subVector(Coords.getVector(this.p[0]), Coords.getCoord(this.p[1]));

		this.normal = crossproduct(this.line1, this.line2);
	}

	getBase(){
		return Coords.getCoord(this.p[1]);
	}

	static templateTri(p0, p1, p2, col){
		return new Polygon('tri', 'normal', 'one', p0, p1, p2, col);
	}

	static templateRect(p0, p1, p2, col){
		return new Polygon('rect', 'normal', 'one', p0, p1, p2, col);
	}
}

class blocks {
	offset;
	coords;
	polys;
	constructor(){
		this.offset = Coords.addCoord(0, 0, 0);
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

class Camera{
	#deg;
	#aspect;
	#near;
	#far;
	/*#x;
	#y;
	#Z;*/
	#p;
	/*#rayDef;
	#topDef;
	#rightDef;*/
	#screen;
	constructor(deg, aspect, near, far){
		this.#deg = deg;
		this.#aspect = aspect;
		this.#near = near;
		this.#far = far;

		if(this.#deg == undefined) {
			this.#deg = 45;
		}
		if(this.#aspect == undefined) {
			this.#aspect = 480 / 360;
		}
		if(this.#near == undefined) {
			this.#near = 1;
		}
		if(this.#far == undefined) {
			this.#far = Infinity;
		}

		//this.#p = new Int32Array(4 * 3); // pos, ray, right, top : x, y, z
		this.#p = new Int32Array([0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0]);
		this.#screen = new Int32Array(3 * 3); //leftTop, rightTop, leftUnder : x, y, z

		/*this.rayDefault = {
			x: 0,
			y: 0,
			z: 1;
		};
		this.rightDefault = {
			x: 1,
			y: 0,
			z: 0;
		};

		this.topDefault = {
			x: 0,
			y: 1,
			z: 0;
		};*/
	}

	updateScreen(){
		const rad = 2 * Math.PI * (deg / 2) / 360;
		const top = {
			x: this.#p[0] + this.#p[3] * Math.tan(rad),
			y: this.#p[1] + this.#p[4] * Math.tan(rad),
			z: this.#p[2] + this.#p[5] * Math.tan(rad)
		};

		const under = {
			x: this.#p[0] - this.#p[3] * Math.tan(rad),
			y: this.#p[1] - this.#p[4] * Math.tan(rad),
			z: this.#p[2] - this.#p[5] * Math.tan(rad)
		};

		this.#screen[0] = top.x - this.#p[6] * Math.tan(rad * aspect);
		this.#screen[1] = top.y - this.#p[7] * Math.tan(rad * aspect);
		this.#screen[2] = top.z - this.#p[8] * Math.tan(rad * aspect);

		this.#screen[3] = top.x - this.#p[6] * Math.tan(rad * aspect);
		this.#screen[4] = top.y - this.#p[7] * Math.tan(rad * aspect);
		this.#screen[5] = top.z - this.#p[8] * Math.tan(rad * aspect);

		this.#screen[6] = top.x + this.#p[6] * Math.tan(rad * aspect);
		this.#screen[7] = top.y + this.#p[7] * Math.tan(rad * aspect);
		this.#screen[8] = top.z + this.#p[8] * Math.tan(rad * aspect);
	}

	getMaxDist(){
		return this.#far / this.#near;
	}


	/*lookAt(x, y, z){
		const theta = Math.atan(y / x);
		const gamma = Math.atan(z / x);

		let size = Math.sqrt(x*x + y*y + z*z);

		this.#p[1*3 + 0] = x / size;
		this.#p[1*3 + 1] = y / size;
		this.#p[1*3 + 2] = z / size;

		x ;
		y;
		z;

		this.#p[2*3 + 0] = x;
		this.#p[2*3 + 1] = y;
		this.#p[2*3 + 2] = z;

		this.#p[3*3 + 0] = x;
		this.#p[3*3 + 1] = y;
		this.#p[3*3 + 2] = z;
	}*/

	set(x, y, z){
		this.#p[0*3 + 0] = x;
		this.#p[0*3 + 1] = y;
		this.#p[0*3 + 2] = z;
	}
	move(x, y, z){
		this.#p[0*3 + 0] += x;
		this.#p[0*3 + 1] += y;
		this.#p[0*3 + 2] += z;
	}

	getVec(type){
		return {
			x: this.#p[type*3 + 0],
			x: this.#p[type*3 + 1],
			x: this.#p[type*3 + 2]
		}
	}
	getPos(){
		return this.getVec(0);
	}
	getRay(){
		return this.getVec(1);
	}
	getRight(){
		return this.getVec(2);
	}
	getTop(){
		return this.getVec(3);
	}

	getScreen(n){
		return {
			x: this.#screen[n*3 + 0],
			x: this.#screen[n*3 + 1],
			x: this.#screen[n*3 + 2]
		}
	}

	rotateRay(theta){

	}
	rotateTop(theta){

	}
	rotateRight(theta){

	}
}