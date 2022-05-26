class Camera{
	#deg;
	#aspect;
	#near;
	#far;
	#x;
	#y;
	#Z;
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
			this.#far = infinity;
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
			x: this.#x[type*3 + 0],
			x: this.#y[type*3 + 1],
			x: this.#z[type*3 + 2]
		}
	}
	getPos(){
		return getVec(0);
	}
	getRay(){
		return getVec(1);
	}
	getRight(){
		return getVec(2);
	}
	getTop(){
		return getVec(3);
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