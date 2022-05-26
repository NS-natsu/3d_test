class coords3{
	x;
	y;
	z;
	constructor(){
		this.x = new Float32Array();
		this.y = new Float32Array();
		this.z = new Float32Array();
	}
	addCoord(x, y, z){
		const len = this.x.length;
		let tmp = new Float32Array(len + 1);
		tmp.set(this.x, 0);
		tmp[len] = x;
		this.x = tmp;

		tmp = new Float32Array(len + 1);
		tmp.set(this.y, 0);
		tmp[len] = y;
		this.y = tmp;

		tmp = new Float32Array(len + 1);
		tmp.set(this.z, 0);
		tmp[len] = z;
		this.z = tmp;

		return len;
	}

	getCoord(n){
		return {
			x : this.x[n],
			y : this.y[n],
			z : this.z[n]
		};
	}

	getVector(n, origin){
		let x, y, z;
		if(origin === undefined){
			x = y = z = 0;
		} else if(origin.x === undefined){
			x = this.x[origin];
			y = this.y[origin];
			z = this.z[origin];
		} else {
			x = origin.x;
			y = origin.y;
			z = origin.z;
		}
		return new vector3(this.x[n], this.y[n], this.z[n]);
	}
}

class vector3 {
	x;
	y;
	z;
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

function innerproduct(a, b){
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function crossproduct(a, b){
	let normal = new vector3(
		/*-1 * */(a.y * b.z - a.z * b.y),//外積は定義通りに計算する
		/*-1 * */(a.z * b.x - a.x * b.z),//呼び出し方に注意するようにした
		/*-1 * */(a.x * b.y - a.y * b.x)
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
