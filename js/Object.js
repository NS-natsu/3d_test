class Polygon {
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

		this.normal = vector3.crossproduct(this.line1, this.line2);
	}

	update(){
		this.line1 = vector3.subVector(Coords.getVector(this.p[2]), Coords.getCoord(this.p[1]));
		this.line2 = vector3.subVector(Coords.getVector(this.p[0]), Coords.getCoord(this.p[1]));

		this.normal = vector3.crossproduct(this.line1, this.line2);
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
		this.coords = new Int32Array();
		this.polys = new Int32Array();
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
		const len = this.coords.length;
		let tmp = new Int32Array(len + 1);
		tmp.set(this.coords, 0);
		tmp[len] = coord;
		this.coords = tmp;
		return this;
	}
	addPoly(poly){
		const len = this.polys.length;
		let tmp = new Int32Array(len + 1);
		tmp.set(this.polys, 0);
		tmp[len] = poly;
		this.polys = tmp;
		return this;
	}

	rotateX(theta){
		this.rotateVec({x:1,y:0,z:0}, theta);
	}
	rotateY(theta){
		this.rotateVec({x:0,y:1,z:0}, theta);
	}
	rotateZ(theta){
		this.rotateVec({x:0,y:0,z:1}, theta);
	}
	rotateVec(n, theta){
		const vec = new vector3(0, 0, 0);
		for(const c of this.coords){
			vec.moveto(Coords.x[c], Coords.y[c], Coords.z[c]);
			vec.rotateVec(n, theta);
			Coords.x[c] = vec.x;
			Coords.y[c] = vec.y;
			Coords.z[c] = vec.z;
		}
		for(const poly of this.polys){
			Polygons.update(poly);
		}
	}
}

class Camera {
	pos;
	ray;
	right;
	top;
	constructor(pos, ray, right){
		this.pos = pos;
		this.ray = ray;
		this.right = right;
		this.top = vector3.crossproduct(this.ray, this.right).unitization();
	}
	rotateX(theta){
		this.rotateVec({x:1,y:0,z:0}, theta);
	}
	rotateY(theta){
		this.rotateVec({x:0,y:1,z:0}, theta);
	}
	rotateZ(theta){
		this.rotateVec({x:0,y:0,z:1}, theta);
	}
	rotateVec(n, theta){
		this.ray.rotateVec(n, theta).unitization();
		this.right.rotateVec(n, theta).unitization();
		this.top.rotateVec(n, theta).unitization();
	}
}
